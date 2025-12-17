TEST CASE ID: MSG-001
FEATURE: Project Management / Messaging
MODULE: API / Database

GOAL:
Ensure message saved and appears in thread.

SETUP:
- Project exists.
- Artist and Client IDs linked.

STEPS:
1. Call POST /api/projects/send-message:
   - sender_type: 'client'
   - message: "Hello from client"
2. Verify 'project_messages' for new row.

3. Call POST /api/projects/send-message:
   - sender_type: 'artist'
   - message: "Here is a design"
   - attachments: ["path/to/design.jpg"]

4. Verify 'project_messages' for new row.
5. Verify 'projects' table: 
   - design_files includes "path/to/design.jpg".
   - approval_status set to 'pending'.

EXPECTED RESULT:
- Messages saved correctly.
- Artist attachments sync to design_files.
- Approval status updates on new designs.
