TEST CASE ID: REF-001
FEATURE: Project Management / Reference Notes
MODULE: API / Database

GOAL:
Add/update notes for a reference image.

SETUP:
- Project exists.
- Known image URL (e.g. from previous upload or dummy).

STEPS:
1. Call PATCH /api/projects/update-reference-note:
   - project_id
   - image_url: "http://example.com/test.jpg"
   - note: "Specific note about this image."

2. Inspect DB:
   - projects.reference_notes JSONB contains key "http://example.com/test.jpg" with value "Specific note about this image.".

EXPECTED RESULT:
- API returns 200.
- DB updated correctly.
