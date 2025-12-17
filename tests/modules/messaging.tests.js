
export const name = "Messaging Module";

export const tests = {
    "Artist Sends Message to Project Thread": async ({ api, db, assert, seed }) => {
        // Helper creates project in 'design' mode by default or specified
        // Previous context: seed.createProject("design") puts it in design mode
        const project = await seed.createProject("design");

        await api.post("/api/projects/send-message", {
            project_id: project.id,
            sender_type: "artist",
            message: "Here is the first draft!",
            attachments: []
        });

        const messages = await db.messagesForProject(project.id);

        assert.equal(messages.length, 1);
        assert.equal(messages[0].sender_type, "artist");
    },

    "Client Approves Draft": async ({ api, db, assert, seed }) => {
        // Re-use project or create new. 
        // If we use same project as above (via singleton TEST_DATA.project_id), we are fine.
        const project = await seed.createProject("design");

        await api.patch("/api/projects/approve", {
            project_id: project.id,
            approval_status: "approved"
        });

        const updated = await db.projectById(project.id);

        assert.equal(updated.status, "approved");
        assert.equal(updated.approval_status, "approved");
    }
};
