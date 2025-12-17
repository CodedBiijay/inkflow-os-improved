const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load env
let envConfig = {};
try {
    envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error("Failed to load .env.local");
}

const REPORT = {
    env_check: "PENDING",
    supabase_connectivity: "PENDING",
    data_seed: "SKIPPED",
    availability_engine: "PENDING",
    availability_attempts: 0,
    availability_healed_by_retry: false,
    availability_healed_by_reseed: false,
    booking_creation: "PENDING",
    booking_attempts: 0,
    booking_healed_by_retry: false,
    booking_healed_by_reseed: false,
    deposit_link: "PENDING",
    deposit_link_attempts: 0,
    deposit_link_healed_by_retry: false,
    deposit_link_healed_by_reseed: false,
    webhook_confirmation: "PENDING",
    webhook_checks: 0,
    webhook_healed_by_wait: false,
    intake_submission: "PENDING",
    intake_attempts: 0,
    intake_healed_by_retry: false,
    intake_healed_by_reseed: false,
    pipeline_design: "PENDING",
    pipeline_awaiting_approval: "PENDING",
    pipeline_approved: "PENDING",
    pipeline_session_scheduled: "PENDING",
    pipeline_completed: "PENDING",
    negative_tests: "PENDING",
    data_integrity: "PENDING",
    overall_status: "PENDING"
};

const BASE_URL = 'http://localhost:3000';
let supabase;

const FIXED_IDS = {
    artist: '11111111-1111-1111-1111-111111111111',
    client: '22222222-2222-2222-2222-222222222222',
    service: '33333333-3333-3333-3333-333333333333',
    booking: '44444444-4444-4444-4444-444444444444',
    project: '66666666-6666-6666-6666-666666666666'
};

// Global state for dynamic IDs from tests
const STATE = {
    generatedBookingId: null
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- CONTROLLERS ---

async function checkEnv() {
    const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error("Missing ENV:", missing);
        REPORT.env_check = "FAIL";
        REPORT.overall_status = "FAIL_ENV";
        return false;
    }
    REPORT.env_check = "PASS";
    supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    return true;
}

async function checkConnectivity() {
    try {
        const { error } = await supabase.from('bookings').select('id').limit(1);
        if (error) throw error;
        REPORT.supabase_connectivity = "PASS";
        return true;
    } catch (e) {
        console.error("DB Connectivity Fail:", e.message);
        REPORT.supabase_connectivity = "FAIL";
        REPORT.overall_status = "FAIL_DB";
        return false;
    }
}

async function seedData() {
    console.log("--> Seeding Data...");
    try {
        // Artist
        const { error: e1 } = await supabase.from('artists').upsert({
            id: FIXED_IDS.artist, name: "Test Artist", email: "artist@test.com", style: "General"
        });
        if (e1) console.log("Artist seed warn:", e1.message);

        // Client
        const { error: e2 } = await supabase.from('clients').upsert({
            id: FIXED_IDS.client, name: "Test Client", email: "client@test.com", phone: "1234567890"
        });
        if (e2) console.log("Client seed warn:", e2.message);

        // Service
        const { error: e3 } = await supabase.from('services').upsert({
            id: FIXED_IDS.service, name: "Test Service", duration_minutes: 60, price: 100, deposit_required: 50
        });
        if (e3) console.log("Service seed warn:", e3.message);

        // Booking (Fallback)
        const { error: e4 } = await supabase.from('bookings').upsert({
            id: FIXED_IDS.booking,
            artist_id: FIXED_IDS.artist,
            client_id: FIXED_IDS.client,
            service_id: FIXED_IDS.service,
            start_time: "2025-02-28T10:00:00Z",
            end_time: "2025-02-28T11:00:00Z",
            status: 'deposit_due',
            deposit_amount: 50
        });
        if (e4) console.log("Booking seed warn:", e4.message);

        // Availability (Ensure some exists)
        // Note: Assuming availability table structure.
        const { error: e5 } = await supabase.from('availability').upsert({
            artist_id: FIXED_IDS.artist,
            date: "2025-02-10",
            start_time: "10:00:00",
            end_time: "18:00:00"
        }, { onConflict: 'artist_id, date' }); // Adjust conflict target if needed
        if (e5) console.log("Availability seed warn:", e5.message);

        REPORT.data_seed = "PERFORMED"; // Or set earlier if we conditionally run this
        return true;
    } catch (e) {
        console.error("Seeding failed:", e);
        REPORT.data_seed = "FAIL";
        return false;
    }
}

// --- TEST RUNNER ---

async function runStep(stepKey, testFn, opts = { retries: 2, heal: true }) {
    console.log(`\nStarting ${stepKey}...`);
    let attempt = 0;
    const maxAttempts = 1 + opts.retries + (opts.heal ? 1 : 0); // Base + Retries + Heal Retry

    while (attempt < maxAttempts) {
        attempt++;
        REPORT[`${stepKey}_attempts`] = attempt;

        try {
            await testFn();
            REPORT[stepKey] = "PASS";
            console.log(`  PASSED`);
            return;
        } catch (e) {
            console.log(`  Attempt ${attempt} failed: ${e.message}`);

            // Heuristics
            const isMissingData = e.message.includes("Foreign key constraint") || e.message.includes("not found") || e.message.includes("404");
            const isNetwork = e.message.includes("fetch") || e.message.includes("500") || e.message.includes("ECONNREFUSED");

            if (attempt < maxAttempts) {
                if (isMissingData && opts.heal && !REPORT[`${stepKey}_healed_by_reseed`]) {
                    console.log("  -> Triggering SELF-HEALING (Reseed)...");
                    await seedData();
                    REPORT[`${stepKey}_healed_by_reseed`] = true;
                    // Dont wait long after reseed, just retry
                } else {
                    console.log("  -> Retrying...");
                    REPORT[`${stepKey}_healed_by_retry`] = true;
                    await sleep(1500);
                }
            } else {
                REPORT[stepKey] = "FAIL";
                console.error(`  FAILED: ${e.message}`);
            }
        }
    }
}

async function fetchJson(url, opts = {}) {
    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
        opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
    }
    const res = await fetch(url, opts);
    if (res.status >= 400) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    return res;
}

// --- MAIN ---

async function main() {
    console.log("⭐ INKFLOW-OS — SELF-HEALING QA EXECUTION\n");

    // STEP 0
    if (!await checkEnv()) return finish();
    if (!await checkConnectivity()) return finish();

    // STEP 0.5 - Initial speculative seed to prevent first-run failures
    await seedData();

    // STEP 1 - Availability
    await runStep('availability_engine', async () => {
        const res = await fetchJson(`${BASE_URL}/api/availability?artist_id=${FIXED_IDS.artist}&service_id=${FIXED_IDS.service}&date=2025-02-10`);
        const data = await res.json();
        if (!data.slots || data.slots.length === 0) throw new Error("No slots returned");
    });

    // STEP 2 - Booking
    await runStep('booking_creation', async () => {
        // Use a random time to avoid overlap with previous runs
        const randHour = 10 + Math.floor(Math.random() * 8); // 10-18
        const res = await fetchJson(`${BASE_URL}/api/bookings/create`, {
            method: 'POST',
            body: {
                artist_id: FIXED_IDS.artist,
                client_id: FIXED_IDS.client,
                service_id: FIXED_IDS.service,
                // Use safe date in future
                start_time: `2025-02-20T${randHour}:00:00Z`,
                end_time: `2025-02-20T${randHour + 1}:00:00Z`,
                deposit_amount: 50
            }
        });
        const data = await res.json();
        if (!data.booking || !data.booking.id) throw new Error("No booking ID returned");
        STATE.generatedBookingId = data.booking.id;
    });

    // STEP 3 - Deposit
    await runStep('deposit_link', async () => {
        const bid = STATE.generatedBookingId || FIXED_IDS.booking;
        const res = await fetchJson(`${BASE_URL}/api/deposits/create-payment-link`, {
            method: 'POST',
            body: { booking_id: bid }
        });
        const data = await res.json();
        if (!data.url) throw new Error("No URL returned");
    });

    // STEP 4 - Webhook
    // Note: We use the simulate-signed-POST method as it is more reliable for automated scripts than invoking CLI
    await runStep('webhook_confirmation', async () => {
        const bid = STATE.generatedBookingId || FIXED_IDS.booking;

        // Construct Signed Payload
        const payload = JSON.stringify({
            id: 'evt_qa_heal_' + Date.now(),
            object: 'event',
            type: 'checkout.session.completed',
            data: { object: { metadata: { booking_id: bid } } }
        });
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const signedPayload = `${timestamp}.${payload}`;
        const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
        const sig = `t=${timestamp},v1=${hmac}`;

        await fetchJson(`${BASE_URL}/api/deposits/webhook`, {
            method: 'POST',
            headers: { 'stripe-signature': sig },
            body: payload // fetchJson handles stringify but we already did it for signing
        });

        // Loop check DB
        let checked = 0;
        let confirmed = false;
        while (!confirmed && checked < 5) {
            checked++;
            REPORT.webhook_checks = checked;
            const { data } = await supabase.from('bookings').select('status').eq('id', bid).single();
            if (data && data.status === 'confirmed') {
                confirmed = true;
            } else {
                await sleep(1000);
                REPORT.webhook_healed_by_wait = true;
            }
        }
        if (!confirmed) throw new Error("DB status not confirmed after wait");
    });

    // STEP 5 - Intake
    await runStep('intake_submission', async () => {
        const bid = STATE.generatedBookingId || FIXED_IDS.booking;
        const res = await fetchJson(`${BASE_URL}/api/intake/submit`, {
            method: 'POST',
            body: {
                booking_id: bid,
                body_location: "Leg",
                tattoo_size: "Small",
                style: "Tribal",
                budget: 200,
                additional_notes: "QA Healed"
            }
        });
        // Verify project existence
        const { data: p } = await supabase.from('projects').select('id, status').eq('booking_id', bid).single();
        if (!p) throw new Error("Project not verified in DB");
    });

    // STEP 6 - Pipeline
    const statuses = ['design', 'awaiting_approval', 'approved', 'session_scheduled', 'completed'];
    for (const st of statuses) {
        await runStep(`pipeline_${st}`, async () => {
            // Need project ID.
            // We can get it from booking relation.
            const bid = STATE.generatedBookingId || FIXED_IDS.booking;
            const { data: p } = await supabase.from('projects').select('id').eq('booking_id', bid).single();
            if (!p) throw new Error("Project missing for pipeline");

            const res = await fetchJson(`${BASE_URL}/api/projects/advance`, {
                method: 'POST',
                body: { project_id: p.id, next_status: st }
            });
            const data = await res.json();
            if (data.project.status !== st) throw new Error("Status update mismatch");
        });
    }

    // STEP 7 - Negative
    await runStep('negative_tests', async () => {
        try { await fetchJson(`${BASE_URL}/api/bookings/create`, { method: 'POST', body: {} }); throw new Error("create should fail"); } catch (e) { if (!e.message.includes("400")) throw e; }
        // Pass if caught
    });

    // STEP 8 - Data Integrity
    await runStep('data_integrity', async () => {
        const bid = STATE.generatedBookingId || FIXED_IDS.booking;
        const { data: b } = await supabase.from('bookings').select('*, projects(*), intake_forms(*)').eq('id', bid).single();
        if (!b) throw new Error("Booking gone");
        if (b.status === 'confirmed' && !b.deposit_paid) throw new Error("Confirmed but unpaid");
        if (!b.projects || b.projects.length === 0) throw new Error("Orphan booking (no project)");
    });

    finish();
}

function finish() {
    const isSuccess = Object.keys(REPORT).filter(k => !k.includes('healed') && !k.includes('attempt') && !k.includes('check')).every(k => {
        if (k === 'overall_status') return true;
        if (REPORT[k] === 'SKIPPED') return true;
        return REPORT[k] === 'PASS';
    });

    REPORT.overall_status = isSuccess ? "PASS" : "FAIL_TESTS";
    if (REPORT.env_check === 'FAIL') REPORT.overall_status = "FAIL_ENV";
    if (REPORT.supabase_connectivity === 'FAIL') REPORT.overall_status = "FAIL_DB";

    console.log("\nFINAL JSON:");
    console.log(JSON.stringify(REPORT, null, 2));

    fs.writeFileSync('qa_healing_report.json', JSON.stringify(REPORT, null, 2));
}

main();
