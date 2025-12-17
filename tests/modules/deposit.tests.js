export const name = "Deposit Module";

export const tests = {
    "Deposit Link Creation": async ({ api, db, assert, seed }) => {
        // NUCLEAR CLEANUP: Remove all future bookings for this artist to ensure clean slate
        // matches Booking module strategy.
        const cleanStart = seed.tomorrowAt("00:00");

        const { data: bToDelete } = await db.from('bookings').select('id')
            .eq('artist_id', seed.artist_id)
            .gte('start_time', cleanStart);

        if (bToDelete && bToDelete.length > 0) {
            const ids = bToDelete.map(b => b.id);
            await db.from('projects').update({ last_booking_id: null }).in('last_booking_id', ids);
            await db.from('bookings').delete().in('id', ids);
        }

        // Start at 12:00
        const booking = await seed.createBooking({
            start_time: seed.tomorrowAt("12:00"),
            end_time: seed.tomorrowAt("13:00")
        });

        const response = await api.post("/api/deposits/create-payment-link", {
            booking_id: booking.id
        });

        assert.ok(response.url, "Stripe URL returned");

        const updated = await db.bookingById(booking.id);
        // Adjusted assertion: Route saves 'deposit_link', not 'payment_intent_id' at creation time.
        assert.ok(updated.deposit_link, "Deposit link saved");

        // Pass booking ID to next test if needed (though next test creates its own)
        seed.bookingId = booking.id;
    },

    "Stripe Payment Success Webhook": async ({ api, db, assert, seed }) => {
        // Already cleaned by range above? No, separate tests. Run sequentially? 
        // Yes, run sequentially. But if previous test failed or something left it?
        // Best to clean specifically here too, or trust the first test did it (if broad enough).
        // Let's use specific FK safe cleanup for this slot just in case.

        // Actually, simpler: The first test cleaned 12-15. This test uses 13:00.
        // If running full suite, Test 1 runs, creates 12:00. Test 2 runs.
        // Gap 13:00-14:00 to ensure no boundary overlap with previous test (12-13)
        const start14 = seed.tomorrowAt("14:00");
        const end15 = seed.tomorrowAt("15:00");

        const booking = await seed.createBooking({
            start_time: start14,
            end_time: end15
        });

        await api.simulateStripeSuccess(booking);

        const updated = await db.bookingById(booking.id);
        assert.equal(updated.status, "confirmed");
    }
};
