
export const name = "Intake Module";

export const tests = {
    "Client Intake Submission": async ({ api, db, assert, seed }) => {
        // Note: status 'intake' sets the connected project to intake mode
        const project = await seed.createProject("intake");

        // The backend now supports JSON for intakes without files
        const response = await api.post("/api/intake/submit", {
            project_id: project.id,
            client_id: project.client_id, // createProject returns full object? check helper.
            // helper createProject returns `data`. `data` is the project row.
            description: "Black and grey dragon",
            placement: "Upper arm",
            reference_images: []
        });

        const updated = await db.projectById(project.id);

        // Check Status Advance
        assert.equal(updated.status, "design");
        // Check Form Logic
        assert.ok(updated.intake_form_id, "Intake form linked");
    }
};
