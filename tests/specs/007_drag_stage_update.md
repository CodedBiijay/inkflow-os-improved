TEST CASE ID: PRJ-001
FEATURE: Project Board / Drag & Drop
MODULE: Workflow / API

GOAL:
Dragging card between columns updates stage.

SETUP:
- Existing Project in 'session_scheduled' (or any stage).

STEPS:
1. Verify initial stage (e.g., 'session_scheduled').
2. Call PATCH /api/projects/update-stage with:
   - project_id
   - new status (e.g., 'completed')
3. Inspect DB:
   - Project status should be 'completed'.
   - updated_at should be recent.

EXPECTED RESULT:
- API returns 200 with updated project.
- Database reflects new status.
