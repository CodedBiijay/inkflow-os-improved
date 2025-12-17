export const tests = {
    "Update Artist Profile": async ({ api, db, assert, seed }) => {
        // 1. Update Profile via API
        const newName = "Updated Artist Name " + Date.now();
        const newTimezone = "America/Los_Angeles";
        const newStudio = "Updated Studio " + Date.now();

        const res = await api.patch("/api/settings/profile", {
            artist_id: seed.artist_id,
            name: newName,
            timezone: newTimezone,
            studio_name: newStudio
        });

        assert.equal(res.success, true, "API should return success");
        assert.equal(res.artist.name, newName, "Returned artist should have new name");

        // 2. Verify in DB
        const { data: artistInDb } = await db.from("artists")
            .select("*")
            .eq("id", seed.artist_id)
            .single();

        assert.equal(artistInDb.name, newName, "DB name should be updated");
        assert.equal(artistInDb.timezone, newTimezone, "DB timezone should be updated");
        assert.equal(artistInDb.studio_name, newStudio, "DB studio_name should be updated");
    },

    "Update Payment Settings": async ({ api, db, assert, seed }) => {
        // 1. Update Payments via API
        const newDeposit = 150.50;

        const res = await api.patch("/api/settings/payments", {
            artist_id: seed.artist_id,
            default_deposit_amount: newDeposit
        });

        assert.equal(res.success, true, "API should return success");

        // 2. Verify in DB
        const { data: artistInDb } = await db.from("artists")
            .select("default_deposit_amount")
            .eq("id", seed.artist_id)
            .single();

        assert.equal(Number(artistInDb.default_deposit_amount), newDeposit, "DB deposit amount should be updated");
    }
};
