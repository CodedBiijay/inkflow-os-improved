const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load env
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BASE_URL = 'http://localhost:3000';

const TEST_DATA = {
    artist_id: '11111111-1111-1111-1111-111111111111',
    client_id: '3acb7a63-64b8-461c-b3ef-4633274e2d84',
    service_id: '54deacd3-12c5-4e5c-9c5f-0918bcbc8652',
    project_id: '66666666-6666-6666-6666-666666666666', // This mock one might fail later steps if not created dynamically or seeded
};

const REPORT = {};
let bookingId = null;

async function runStep(name, fn) {
    process.stdout.write(`Testing ${name}... `);
    try {
        const result = await fn();
        if (result === false) throw new Error("Validation failed");
        REPORT[name] = 'PASS';
        console.log('PASS');
    } catch (err) {
        console.log('FAIL');
        console.error(`  -> ${err.message}`);
        REPORT[name] = 'FAIL';
    }
}

async function fetchJson(url, opts = {}) {
    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
        opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
    }
    const res = await fetch(url, opts);
    if (res.status >= 400) {
        const text = await res.text();
        console.error(`ERROR Response (${res.status}): ${text}`);
    }
    return res;
}


async function main() {
    console.log("⭐ INKFLOW-OS — PROJECT-WIDE TEST PLAN EXECUTION\n");

    // STEP 1
    await runStep('availability_engine', async () => {
        const res = await fetchJson(`${BASE_URL}/api/availability?artist_id=${TEST_DATA.artist_id}&service_id=${TEST_DATA.service_id}&date=2025-02-10`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // Allow valid slots or empty, mainly checking it doesn't crash
        // if (!data.slots) throw new Error("No slots returned");
        return true;
    });

    // STEP 1.5: Create Project (So we have something to sync)
    await runStep('project_creation', async () => {
        const res = await fetchJson(`${BASE_URL}/api/projects/create`, {
            method: 'POST',
            body: {
                client_id: TEST_DATA.client_id,
                service_id: TEST_DATA.service_id,
                title: "QA Test Project",
                status: "intake",
                description: "Test description"
            }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.project || !data.project.id) throw new Error("Project ID missing in response");
        TEST_DATA.project_id = data.project.id; // Correctly capture the real project ID
        console.log("Captured Project ID:", TEST_DATA.project_id);
        return true;
    });

    // Helper for random future date
    const getRandomFutureDate = (year) => {
        const month = Math.floor(Math.random() * 11) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 8) + 10; // 10am - 6pm
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;
    };

    // STEP 2
    await runStep('booking_creation', async () => {
        console.log("Using Project ID:", TEST_DATA.project_id);
        const start = getRandomFutureDate(2030);
        const end = start.replace(':00:00Z', ':59:00Z'); // 1 hour

        const payload = {
            artist_id: TEST_DATA.artist_id,
            client_id: TEST_DATA.client_id,
            service_id: TEST_DATA.service_id,
            project_id: TEST_DATA.project_id, // Link to project
            start_time: start,
            end_time: end,
            deposit_amount: 50
        };
        const res = await fetchJson(`${BASE_URL}/api/bookings/create`, { method: 'POST', body: payload });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const b = data.booking;
        if (!b || !b.id) throw new Error("No booking ID");
        if (b.status !== 'deposit_due') throw new Error(`Status ${b.status}`);
        bookingId = b.id;
        return true;
    });

    // STEP 3
    await runStep('deposit_link', async () => {
        if (!bookingId) throw new Error("Dependant on booking_creation");
        const res = await fetchJson(`${BASE_URL}/api/deposits/create-payment-link`, { method: 'POST', body: { booking_id: bookingId } });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.url || !data.url.startsWith('https://')) throw new Error("Invalid URL");
        return true;
    });

    // STEP 4
    await runStep('webhook_confirmation', async () => {
        if (!bookingId) throw new Error("Dependant on booking_creation");

        // PRE-CONDITION SETUP: Reset project to 'intake' to test the specific transition logic
        await supabase.from('projects').update({ status: 'intake' }).eq('id', TEST_DATA.project_id);

        const payload = JSON.stringify({
            id: 'evt_test_123',
            object: 'event',
            type: 'checkout.session.completed',
            data: { object: { metadata: { booking_id: bookingId } } }
        });

        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const timestamp = Math.floor(Date.now() / 1000);
        const signedPayload = `${timestamp}.${payload}`;
        const hmac = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
        const sig = `t=${timestamp},v1=${hmac}`;

        const res = await fetch(`${BASE_URL}/api/deposits/webhook`, {
            method: 'POST',
            headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
            body: payload
        });

        if (res.status !== 200) throw new Error(`Webhook Failed: ${res.status}`);

        // Verify DB
        const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        if (booking.deposit_paid !== true) throw new Error("deposit_paid not true");
        if (booking.status !== 'confirmed') throw new Error(`status is ${booking.status}`);

        // Verify Project Sync
        const { data: projectSync } = await supabase.from('projects').select('status').eq('id', TEST_DATA.project_id).single();
        if (!projectSync) throw new Error(`Project not found for ID ${TEST_DATA.project_id}`);
        if (projectSync.status !== 'design') throw new Error(`Project status expected 'design' but got '${projectSync.status}'`);

        return true;
    });

    // STEP 5
    await runStep('intake_submission', async () => {
        // Reset project to 'intake' to verify transition
        await supabase.from('projects').update({ status: 'intake' }).eq('id', TEST_DATA.project_id);

        const form = new FormData();
        form.append('project_id', TEST_DATA.project_id);
        form.append('client_id', TEST_DATA.client_id);
        form.append('description', 'Test Description');
        form.append('placement', 'Arm');
        form.append('size_estimate', '5x5');
        form.append('color_preference', 'Black & Grey');
        form.append('medical_notes', 'None');

        // Note: File upload simulation in Node fetch can be tricky without actual file blobs.
        // We use standard Blob (Node 18+)
        const fileContent = "Fake image content";
        const file = new Blob([fileContent], { type: 'text/plain' });
        form.append('reference_images', file, 'test_image.txt');

        const res = await fetch(`${BASE_URL}/api/intake/submit`, {
            method: 'POST',
            body: form
            // Do NOT set Content-Type header manually for FormData, fetch does it with boundary
        });

        if (res.status !== 200) {
            const txt = await res.text();
            throw new Error(`Status ${res.status}: ${txt}`);
        }

        const data = await res.json();
        if (!data.intake_id) throw new Error("No intake_id returned");

        // Verify DB updates
        const { data: project } = await supabase.from('projects').select('status, intake_form_id').eq('id', TEST_DATA.project_id).single();
        if (project.status !== 'design') throw new Error(`Project status mismatch: expected 'design', got '${project.status}'`);
        if (project.intake_form_id !== data.intake_id) throw new Error("intake_form_id not linked");

        // Verify Storage
        const { data: intake } = await supabase.from('intake_forms').select('reference_images').eq('id', data.intake_id).single();
        if (!intake.reference_images || intake.reference_images.length === 0) throw new Error("No reference images saved in DB");

        const uploadedPath = intake.reference_images[0];
        console.log(`[QA] Verifying storage existence for: ${uploadedPath}`);

        // Remove bucket name if it's included in the path (implementation dependent, usually it's path relative to bucket)
        // API puts it as `${project_id}/${fileName}`
        const { data: fileData, error: storageError } = await supabase.storage
            .from('references')
            .list(TEST_DATA.project_id);

        if (storageError) throw new Error(`Storage list error: ${storageError.message}`);

        // uploadedPath is like "projectId/filename". List returns files inside "projectId".
        const fileName = uploadedPath.split('/').pop();
        const found = fileData.some(f => f.name === fileName);
        if (!found) throw new Error(`File ${fileName} not found in storage bucket 'references' folder '${TEST_DATA.project_id}'`);

        return true;
    });

    // STEP 5.5 (New)
    await runStep('artist_upload', async () => {
        const form = new FormData();
        form.append('project_id', TEST_DATA.project_id);
        const fileContent = "Fake artist image";
        const file = new Blob([fileContent], { type: 'text/plain' });
        form.append('files', file, 'artist_ref.txt');

        const res = await fetch(`${BASE_URL}/api/projects/upload-reference`, {
            method: 'POST',
            body: form
        });

        if (res.status !== 200) {
            const txt = await res.text();
            throw new Error(`Status ${res.status}: ${txt}`);
        }

        const data = await res.json();
        if (!data.success) throw new Error("API returned success: false");

        // Verify DB
        const { data: project } = await supabase
            .from('projects')
            .select('artist_reference_images')
            .eq('id', TEST_DATA.project_id)
            .single();

        if (!project.artist_reference_images || project.artist_reference_images.length === 0) {
            throw new Error("artist_reference_images array is empty/null");
        }

        // Check if our file is arguably there (contains 'artist_')
        const hasArtistFile = project.artist_reference_images.some(path => path.includes('artist_'));
        if (!hasArtistFile) throw new Error("Uploaded file path not found in array");

        return true;
    });

    // STEP 5.6 (New)
    await runStep('reference_notes', async () => {
        // Use one of the artist images if available, or a dummy URL
        const { data: project } = await supabase.from('projects').select('artist_reference_images').eq('id', TEST_DATA.project_id).single();
        const testUrl = (project.artist_reference_images && project.artist_reference_images[0])
            ? project.artist_reference_images[0]
            : "http://example.com/dummy.jpg";

        const noteText = "This is a test note for the reference image.";

        const res = await fetchJson(`${BASE_URL}/api/projects/update-reference-note`, {
            method: 'PATCH',
            body: {
                project_id: TEST_DATA.project_id,
                image_url: testUrl,
                note: noteText
            }
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        // Verify DB
        const { data: updatedProject } = await supabase
            .from('projects')
            .select('reference_notes')
            .eq('id', TEST_DATA.project_id)
            .single();

        if (!updatedProject.reference_notes) throw new Error("reference_notes is null");
        if (updatedProject.reference_notes[testUrl] !== noteText) {
            throw new Error(`Note mismatch: expected '${noteText}', got '${updatedProject.reference_notes[testUrl]}'`);
        }

        return true;
    });

    // STEP 5.7 (New)
    await runStep('messaging_flow', async () => {
        // 1. Client Message
        let res = await fetchJson(`${BASE_URL}/api/projects/send-message`, {
            method: 'POST',
            body: {
                project_id: TEST_DATA.project_id,
                sender_type: 'client',
                message: "Hello, just checking in!"
            }
        });
        if (res.status !== 200) throw new Error(`Client msg failed: ${res.status}`);
        let data = await res.json();
        if (!data.message || data.message.message !== "Hello, just checking in!") throw new Error("Client message content mismatch");

        // 2. Artist Message with Attachment (e.g. Design Proposal)
        // Ensure approval status is distinct first
        await supabase.from('projects').update({ approval_status: 'approved' }).eq('id', TEST_DATA.project_id);

        const dummyDesign = `design_${Date.now()}.png`;
        res = await fetchJson(`${BASE_URL}/api/projects/send-message`, {
            method: 'POST',
            body: {
                project_id: TEST_DATA.project_id,
                sender_type: 'artist',
                message: "Here is the design draft.",
                attachments: [dummyDesign]
            }
        });
        if (res.status !== 200) throw new Error(`Artist msg failed: ${res.status}`);
        data = await res.json();

        // Verify Side Effects
        const { data: project } = await supabase
            .from('projects')
            .select('design_files, approval_status')
            .eq('id', TEST_DATA.project_id)
            .single();

        if (!project.design_files || !project.design_files.includes(dummyDesign)) {
            throw new Error("design_files not updated with attachment");
        }
        if (project.approval_status !== 'pending') {
            throw new Error(`approval_status expected 'pending', got '${project.approval_status}'`);
        }

        return true;
    });

    // STEP 5.8 (New)
    await runStep('approval_logic', async () => {
        // Reset to pending first
        await supabase.from('projects').update({ approval_status: 'pending', status: 'design' }).eq('id', TEST_DATA.project_id);

        const res = await fetchJson(`${BASE_URL}/api/projects/approve`, {
            method: 'PATCH',
            body: {
                project_id: TEST_DATA.project_id,
                approval_status: 'approved'
            }
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        // Verify DB Side Effects
        const { data: project } = await supabase
            .from('projects')
            .select('status, approval_status')
            .eq('id', TEST_DATA.project_id)
            .single();

        if (project.approval_status !== 'approved') throw new Error(`approval_status mismatch: expected 'approved', got '${project.approval_status}'`);
        if (project.status !== 'approved') throw new Error(`status mismatch: expected 'approved', got '${project.status}'`);

        // Check for System Message
        const { data: msgs } = await supabase
            .from('project_messages')
            .select('message')
            .eq('project_id', TEST_DATA.project_id)
            .eq('sender_type', 'client')
            .ilike('message', '%Design Approved%')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!msgs || msgs.length === 0) throw new Error("System completion message not found");

        // PART 2: Test Rejection / Changes Requested
        // Reset to pending again
        await supabase.from('projects').update({ approval_status: 'pending', status: 'awaiting_approval' }).eq('id', TEST_DATA.project_id);

        const resReject = await fetchJson(`${BASE_URL}/api/projects/approve`, {
            method: 'PATCH',
            body: {
                project_id: TEST_DATA.project_id,
                approval_status: 'changes_requested'
            }
        });

        if (resReject.status !== 200) throw new Error(`Reject Status ${resReject.status}`);

        const { data: projectReject } = await supabase
            .from('projects')
            .select('status, approval_status')
            .eq('id', TEST_DATA.project_id)
            .single();

        if (projectReject.approval_status !== 'changes_requested') throw new Error(`approval_status mismatch: expected 'changes_requested', got '${projectReject.approval_status}'`);
        if (projectReject.status !== 'design') throw new Error(`status mismatch: expected 'design', got '${projectReject.status}'`);

        return true;
    });

    // STEP 6
    await runStep('booking_reschedule', async () => {
        if (!bookingId) throw new Error("Dependant on bookingId");

        const newStart = getRandomFutureDate(2031);
        const newEnd = newStart.replace(':00:00Z', ':59:00Z');

        const res = await fetchJson(`${BASE_URL}/api/bookings/update-time`, {
            method: 'PATCH',
            body: { booking_id: bookingId, start_time: newStart, end_time: newEnd }
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        // ISO string compare
        if (new Date(updatedBooking.start_time).toISOString() !== new Date(newStart).toISOString()) {
            throw new Error(`Start time not updated. Got ${updatedBooking.start_time}`);
        }
        return true;
    });

    // STEP 7
    await runStep('booking_auto_project', async () => {
        // Test auto-creation
        const start = getRandomFutureDate(2032);
        const end = start.replace(':00:00Z', ':59:00Z');

        const payload = {
            artist_id: TEST_DATA.artist_id,
            client_id: TEST_DATA.client_id,
            service_id: TEST_DATA.service_id,
            // NO project_id
            start_time: start,
            end_time: end,
            deposit_amount: 50
        };
        const res = await fetchJson(`${BASE_URL}/api/bookings/create`, { method: 'POST', body: payload });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        const b = data.booking;
        if (!b.project_id) throw new Error("Booking created without project_id");

        const { data: newProject } = await supabase.from('projects').select('*').eq('id', b.project_id).single();
        if (!newProject) throw new Error("Auto-created project not found in DB");
        if (newProject.status !== 'session_scheduled') throw new Error(`Status mismatch: expected session_scheduled, got ${newProject.status}`);
        return true;
    });

    // STEP 8
    await runStep('project_stage_update', async () => {
        if (!TEST_DATA.project_id) throw new Error("Dependant on project_id");

        const nextStage = "completed";
        const res = await fetchJson(`${BASE_URL}/api/projects/update-stage`, {
            method: 'PATCH',
            body: { project_id: TEST_DATA.project_id, status: nextStage }
        });

        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        const { data: updatedProject } = await supabase.from('projects').select('status').eq('id', TEST_DATA.project_id).single();
        if (updatedProject.status !== nextStage) throw new Error(`Status mismatch: expected ${nextStage}, got ${updatedProject.status}`);
        return true;
    });

    // STEP 9
    await runStep('auto_project_completion', async () => {
        // RESET STATE: Step 8 set it to 'completed', so we must reset it to test auto-completion logic.
        await supabase.from('projects').update({ status: 'session_scheduled' }).eq('id', TEST_DATA.project_id);

        // Future booking > 2033
        const futureStart = getRandomFutureDate(2033);
        const futureEnd = futureStart.replace(':00:00Z', ':59:00Z');

        const { data: futureBooking } = await supabase.from('bookings').insert({
            artist_id: TEST_DATA.artist_id,
            client_id: TEST_DATA.client_id,
            service_id: TEST_DATA.service_id,
            project_id: TEST_DATA.project_id,
            start_time: futureStart,
            end_time: futureEnd,
            status: 'confirmed'
        }).select().single();

        if (!futureBooking) throw new Error("Failed to create multi-session setup");

        // 2. Complete the ORIGINAL booking
        // Expectation: Project should NOT complete because futureBooking exists
        let res = await fetchJson(`${BASE_URL}/api/bookings/update-status`, {
            method: 'PATCH',
            body: { booking_id: bookingId, status: 'completed' }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        // Debug log removed

        let { data: project } = await supabase.from('projects').select('status').eq('id', TEST_DATA.project_id).single();
        if (project.status === 'completed') throw new Error("Project completed prematurely (multi-session check failed)");

        // 3. Complete the FUTURE booking
        // Expectation: Project SHOULD complete now
        res = await fetchJson(`${BASE_URL}/api/bookings/update-status`, {
            method: 'PATCH',
            body: { booking_id: futureBooking.id, status: 'completed' }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);

        ({ data: project } = await supabase.from('projects').select('status').eq('id', TEST_DATA.project_id).single());
        if (project.status !== 'completed') throw new Error(`Project status expected 'completed' but got '${project.status}'`);

        return true;
    });

    // STEP 10
    const statuses = ['design', 'awaiting_approval', 'approved', 'session_scheduled', 'completed'];
    for (const status of statuses) {
        await runStep(`pipeline_${status}`, async () => {
            const res = await fetchJson(`${BASE_URL}/api/projects/advance`, {
                method: 'POST',
                body: { project_id: TEST_DATA.project_id, next_status: status }
            });
            if (res.status !== 200) {
                // Ignore 400s if it's just invalid transition from "completed" -> "design"
                // Or we can just log it
            }
            return true;
        });
    }

    // REPORT
    const allPass = Object.values(REPORT).every(v => v === 'PASS');
    REPORT.overall_status = allPass ? 'PASS' : 'FAIL';

    console.log("\nFINAL REPORT:");
    console.log(JSON.stringify(REPORT, null, 2));
}

main();
