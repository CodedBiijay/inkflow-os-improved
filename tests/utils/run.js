import crypto from 'node:crypto';
import { supabase, BASE_URL, TEST_DATA, fetchJson } from './env.js';
import { assert } from './assert.js';
import { SeedHelper, DBHelper } from './helpers.js';

export async function runStep(name, fn) {
    process.stdout.write(`Testing ${name}... `);
    try {
        // Construct Context with Helpers

        // Hybrid DB object: Standard methods + Custom helpers
        const dbContext = {
            ...DBHelper,
            from: (table) => supabase.from(table),
            rpc: (fn, args) => supabase.rpc(fn, args)
            // Add other supabase root methods if needed
        };

        const context = {
            api: {
                get: async (url) => { const r = await fetchJson(`${BASE_URL}${url}`); return r.json(); },
                post: async (url, body) => { const r = await fetchJson(`${BASE_URL}${url}`, { method: 'POST', body }); return r.json(); },
                patch: async (url, body) => { const r = await fetchJson(`${BASE_URL}${url}`, { method: 'PATCH', body }); return r.json(); },

                // Helper for Stripe Webhook Simulation
                simulateStripeSuccess: async (booking) => {
                    const payload = JSON.stringify({
                        id: 'evt_test_mod_helper',
                        object: 'event',
                        type: 'checkout.session.completed',
                        data: { object: { metadata: { booking_id: booking.id } } }
                    });

                    const secret = process.env.STRIPE_WEBHOOK_SECRET;
                    const timestamp = Math.floor(Date.now() / 1000);
                    const signedPayload = `${timestamp}.${payload}`;
                    const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
                    const sig = `t=${timestamp},v1=${hmac}`;

                    return await fetchJson(`${BASE_URL}/api/deposits/webhook`, {
                        method: 'POST',
                        headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
                        body: payload
                    });
                },

                // Keep raw fetch available
                fetch: fetchJson
            },
            db: dbContext,
            assert,
            seed: SeedHelper, // Enhanced seed object
            retry: async (fn, retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try { return await fn(); } catch (e) { if (i === retries - 1) throw e; }
                }
            }
        };

        const result = await fn(context);
        if (result === false) throw new Error("Validation failed");
        console.log('PASS');
        return { name, status: 'PASS' };
    } catch (err) {
        console.log('FAIL');
        console.error(`  -> ${err.message} `);
        return { name, status: 'FAIL', error: err.message };
    }
}

export async function runTestsInModule(moduleParams) {
    const results = [];
    if (moduleParams.setup) {
        console.log(`\n-- - Setup: ${moduleParams.name} --- `);
        await moduleParams.setup();
    }

    console.log(`\nRunning Module: ${moduleParams.name || 'Unnamed Module'} `);

    const tests = moduleParams.tests;
    if (!tests) {
        console.error("No tests export found.");
        return [];
    }

    // Support both Array (legacy) and Object (new) formats
    if (Array.isArray(tests)) {
        for (const test of tests) {
            const result = await runStep(test.name, test.fn);
            results.push(result);
            if (result.status === 'FAIL') break;
        }
    } else if (typeof tests === 'object') {
        for (const [testName, testFn] of Object.entries(tests)) {
            const result = await runStep(testName, testFn);
            results.push(result);
            if (result.status === 'FAIL') break;
        }
    }

    return results;
}
