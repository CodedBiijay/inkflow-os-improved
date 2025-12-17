
export const name = "Notifications Module";

export const tests = {
    "Intake Submission Creates Notification": async ({ api, db, assert, seed }) => {
        // 1. Setup Project in 'intake' state
        const project = await seed.createProject("intake");

        // 2. Submit Intake
        const payload = {
            project_id: project.id,
            client_id: seed.client_id,
            description: "Test Notification Trigger",
            placement: "Leg",
            size_estimate: "Small",
            color_preference: "Color",
            medical_notes: "None"
        };

        await api.post("/api/intake/submit", payload);

        // 3. Verify Notification
        const notifications = await db.notificationsForArtist(seed.artist_id);

        // Find specific notification linked to this project to be safe
        const notif = notifications.find(n => n.entity_id === project.id && n.type === 'intake_submitted');

        assert.ok(notif, "Notification found for intake submission");
        assert.equal(notif.is_read, false, "Notification should be unread");
        assert.equal(notif.entity_type, "project", "Entity type mismatch");
    },

    "Deposit Webhook Creates Notification": async ({ api, db, assert, seed }) => {
        // 1. Create Booking with unique time (Random future date)
        const d = new Date();
        d.setDate(d.getDate() + 3); // 3 days out
        d.setMinutes(d.getMinutes() + Math.floor(Math.random() * 1000)); // Random offset
        const start = d.toISOString();
        d.setHours(d.getHours() + 1);
        const end = d.toISOString();

        const booking = await seed.createBooking({
            start_time: start,
            end_time: end
        });
        // 2. Simulate Stripe Success
        const response = await api.simulateStripeSuccess(booking);
        // Ensure successful response
        assert.equal(response.status, 200, "Webhook returned 200 OK");

        // Wait briefly for async trigger
        await new Promise(r => setTimeout(r, 500));

        // 3. Verify Notification
        const notifications = await db.notificationsForArtist(seed.artist_id);

        const notif = notifications.find(n => n.entity_id === booking.id && n.type === 'deposit_paid');

        // Assert
        assert.ok(notif, "Deposit notification should be created");
        assert.equal(notif.title, "Deposit Paid", "Title mismatch");
    },

    "Design Approval Creates Notification": async ({ api, db, assert, seed }) => {
        // 1. Create Project
        const project = await seed.createProject("design");

        // 2. Approve Design
        await api.patch("/api/projects/approve", {
            project_id: project.id,
            approval_status: "approved"
        });

        // 3. Verify Notification
        const notifications = await db.notificationsForArtist(seed.artist_id);
        const notif = notifications.find(n => n.entity_id === project.id && n.type === 'design_approved');

        assert.ok(notif, "Design Approved notification should be created");
        assert.equal(notif.title, "Client Approved Design");
    },

    "Unread Count Verification": async ({ api, db, assert, seed }) => {
        // 1. Get Initial Count
        const initialRes = await api.get(`/api/notifications/list?artist_id=${seed.artist_id}`);
        const initialCount = initialRes.unread_count || 0;

        // 2. Insert 3 Unread Notifications
        // We use a dummy project/entity for simplicity
        const project = await seed.createProject("design");

        for (let i = 0; i < 3; i++) {
            await db.from("notifications").insert({
                artist_id: seed.artist_id,
                type: "new_message",
                title: `Unread Test ${i}`,
                body: "Testing count...",
                entity_type: "project",
                entity_id: project.id,
                is_read: false
            });
        }

        // 3. Get Final Count
        const finalRes = await api.get(`/api/notifications/list?artist_id=${seed.artist_id}`);
        const finalCount = finalRes.unread_count;

        // 4. Assert
        assert.equal(finalCount, initialCount + 3, "Unread count should increase by 3");
    },

    "Mark Notification As Read": async ({ api, db, assert, seed }) => {
        // 1. Create a single unread notification
        const project = await seed.createProject("design");
        const { data: inserted, error } = await db.from("notifications").insert({
            artist_id: seed.artist_id,
            type: "new_message",
            title: "Mark Read Test",
            body: "Will be marked read",
            entity_type: "project",
            entity_id: project.id,
            is_read: false
        }).select().single();

        if (error) throw error;
        const notifId = inserted.id;

        // 2. Get Count Before
        const beforeRes = await api.get(`/api/notifications/list?artist_id=${seed.artist_id}`);
        const countBefore = beforeRes.unread_count;
        const targetBefore = beforeRes.notifications.find(n => n.id === notifId);
        assert.equal(targetBefore.is_read, false, "Should be unread initially");

        // 3. Mark as Read
        const patchRes = await api.patch("/api/notifications/mark-read", {
            notification_id: notifId
        });
        assert.equal(patchRes.success, true);

        // 4. Get Count After
        const afterRes = await api.get(`/api/notifications/list?artist_id=${seed.artist_id}`);
        const countAfter = afterRes.unread_count;
        const targetAfter = afterRes.notifications.find(n => n.id === notifId);

        // 5. Assert
        assert.equal(targetAfter.is_read, true, "Should be read now");
        assert.equal(countAfter, countBefore - 1, "Unread count should decrease by 1");
    },

    "Notifications Sorted Newest First": async ({ api, db, assert, seed }) => {
        // 1. Create Old Notification
        const project = await seed.createProject("design");
        const { data: oldNotif } = await db.from("notifications").insert({
            artist_id: seed.artist_id,
            type: "new_message",
            title: "Old Notification",
            body: "Old body",
            entity_type: "project",
            entity_id: project.id,
            created_at: new Date(Date.now() - 10000).toISOString() // 10s ago
        }).select().single();

        // 2. Create New Notification
        const { data: newNotif } = await db.from("notifications").insert({
            artist_id: seed.artist_id,
            type: "new_message",
            title: "New Notification",
            body: "New body",
            entity_type: "project",
            entity_id: project.id,
            created_at: new Date().toISOString() // Now
        }).select().single();

        // 3. Fetch List
        const res = await api.get(`/api/notifications/list?artist_id=${seed.artist_id}`);
        const list = res.notifications;

        // 4. Find the indices
        const oldIndex = list.findIndex(n => n.id === oldNotif.id);
        const newIndex = list.findIndex(n => n.id === newNotif.id);

        assert.ok(oldIndex !== -1 && newIndex !== -1, "Both notifications found");
        assert.ok(newIndex < oldIndex, "Newer notification should appear before older one");
    }
};
