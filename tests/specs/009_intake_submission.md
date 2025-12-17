TEST CASE ID: INT-001
FEATURE: Intake / Submission
MODULE: Workflow / API

GOAL:
Form submission saves intake and updates project stage.

SETUP:
- Project in 'intake' stage.
- Valid Client ID.

STEPS:
1. Call POST /api/intake/submit with Multipart FormData:
   - project_id
   - client_id
   - description
   - placement
   - size_estimate
   - (Optional) reference_images

2. Inspect DB:
   - intake_forms table has new row.
   - projects table:
     - intake_form_id is set.
     - status is 'design'.

EXPECTED RESULT:
- API returns 200 with intake_id.
- Project status advances to 'design'.
