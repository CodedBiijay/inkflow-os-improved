
export const name = "Gallery Module";

export const tests = {
    "Artist Reference Upload": async ({ api, db, assert, seed }) => {
        // Helper creates project in 'design' mode with linked intake
        const project = await seed.createProjectWithIntake();

        // The backend now supports JSON/Base64 for testing without FormData
        const response = await api.post("/api/projects/upload-reference", {
            project_id: project.id,
            files: await seed.mockImages(2)
        });

        assert.ok(response.newImages.length === 2, "Two URLs returned"); // API returns { newImages: [...] } not "urls"

        const updated = await db.projectById(project.id);

        assert.equal(
            updated.artist_reference_images.length,
            2,
            "References stored"
        );
    }
};
