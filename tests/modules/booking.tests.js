export const name = "Booking Module";

export const tests = {
    "Create Booking End-to-End": async ({ api, db, assert, seed }) => {
        const { client, service, artist } = await seed.basicEntities();

        // NUCLEAR CLEANUP (FK Safe)
        const tomorrowStart = seed.tomorrowAt("00:00");

        // 1. Find bookings to delete
        const { data: bToDelete } = await db.from('bookings').select('id')
            .eq('artist_id', artist.id)
            .gte('start_time', tomorrowStart);

        if (bToDelete && bToDelete.length > 0) {
            const ids = bToDelete.map(b => b.id);

            // 2. Unlink from projects
            await db.from('projects').update({ last_booking_id: null })
                .in('last_booking_id', ids);

            // 3. Delete bookings
            const { error: delErr } = await db.from('bookings').delete()
                .in('id', ids);

            if (delErr) console.error("Cleanup Error:", delErr);
        }

        // Use LATE window (18:00 - 20:00) to avoid conflict with Reschedule (16:00)
        const randHour = Math.floor(Math.random() * 2) + 18;
        const startString = `${randHour}:00`;
        const endString = `${randHour + 1}:00`;

        // EXPLICIT CLEANUP of the chosen slot
        await db.from('bookings').delete()
            .eq('artist_id', artist.id)
            .eq('start_time', seed.tomorrowAt(startString));

        const response = await api.post("/api/bookings/create", {
            client_id: client.id,
            service_id: service.id,
            artist_id: artist.id,
            project_id: seed.project_id,
            start_time: seed.tomorrowAt(startString),
            end_time: seed.tomorrowAt(endString),
            deposit_amount: 50
        });

        assert.ok(response.booking?.id, "Booking ID returned");

        seed.project_id = response.booking.project_id;
        seed.bookingId = response.booking.id;

        const booking = await db.bookingById(response.booking.id);

        assert.equal(booking.status, "deposit_due");
        assert.equal(booking.deposit_amount, 50);

        return { bookingId: booking.id };
    },

    "Reschedule Booking": async ({ api, db, assert, seed }) => {
        // Cleanup 10:00 (default seed.createBooking slot) AND 16:00 (target slot)
        await db.from('bookings').delete().eq('artist_id', seed.artist_id).in('start_time', [seed.tomorrowAt("10:00"), seed.tomorrowAt("16:00")]);

        const booking = await seed.createBooking(); // Defaults to 10:00
        // Update global state for dependents (legacy compat)
        if (booking.project_id) seed.project_id = booking.project_id;
        seed.bookingId = booking.id;

        const targetStart = seed.tomorrowAt("16:00");
        await api.patch("/api/bookings/update-time", {
            booking_id: booking.id,
            start_time: targetStart,
            end_time: seed.tomorrowAt("17:00")
        });

        const updated = await db.bookingById(booking.id);

        // Supabase returns raw string. Slice might depend on exact format. 
        // "2025-02-14T16:00:00+00:00" -> slice(11, 16) = "16:00".
        // If it returns "2025-02-14 16:00:00+00", slice is different.
        // Calculate expected time in UTC from helper
        const expectedStartParams = seed.tomorrowAt("16:00");
        const expectedStartTimeSlice = expectedStartParams.slice(11, 16);

        const expectedEndParams = seed.tomorrowAt("17:00");
        const expectedEndTimeSlice = expectedEndParams.slice(11, 16);

        assert.ok(updated.start_time.includes(expectedStartTimeSlice), `Expected ${expectedStartTimeSlice} in ${updated.start_time}`);
        assert.ok(updated.end_time.includes(expectedEndTimeSlice), `Expected ${expectedEndTimeSlice} in ${updated.end_time}`);
    }
};
