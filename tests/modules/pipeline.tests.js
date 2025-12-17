export const name = "Pipeline Module";

export const tests = {
    "Auto-create Project From Booking": async ({ api, db, assert, seed }) => {
        // Cleanup: Remove all projects for this client/service to avoid zombie data (found 67 duplicates)
        // Must delete related bookings first due to FK constraints.
        const { client, service } = await seed.basicEntities();

        // 1. Find projects to delete
        const { data: projectsToDelete } = await db.from('projects')
            .select('id')
            .eq('client_id', client.id)
            .eq('service_id', service.id);

        if (projectsToDelete?.length > 0) {
            const pIds = projectsToDelete.map(p => p.id);

            // 1. Break Circular Dependency: Nullify last_booking_id
            await db.from('projects').update({ last_booking_id: null }).in('id', pIds);

            // 2. Delete bookings linked to these projects
            const { error: bErr } = await db.from('bookings').delete().in('project_id', pIds);
            if (bErr) console.error("DEBUG: Booking Cleanup Error:", bErr);

            // 3. Delete the projects
            const { error: pErr } = await db.from('projects').delete().in('id', pIds);
            if (pErr) console.error("DEBUG: Project Cleanup Error:", pErr);
        }

        // Ensure unique time to avoid collision
        const booking = await seed.createBooking({
            start_time: seed.tomorrowAt("09:00"),
            end_time: seed.tomorrowAt("10:00")
        });

        const project = await db.projectByClientAndService(
            booking.client_id,
            booking.service_id
        );

        assert.ok(project.id, "Project auto-created");
        assert.equal(project.status, "session_scheduled");
    },

    "Drag & Drop Stage Update": async ({ api, db, assert, seed }) => {
        const project = await seed.createProject("design");

        await api.patch("/api/projects/update-stage", {
            project_id: project.id,
            status: "approved"
        });

        const updated = await db.projectById(project.id);

        assert.equal(updated.status, "approved");
    },

    "Auto-complete After Last Session": async ({ api, db, assert, seed }) => {
        // Use createProjectWithBooking helper (which resets project to session_scheduled)
        const { project, booking } = await seed.createProjectWithBooking();

        await api.patch("/api/bookings/update-status", {
            booking_id: booking.id,
            status: "completed"
        });

        const updated = await db.projectById(project.id);

        assert.equal(updated.status, "completed");
    }
};
