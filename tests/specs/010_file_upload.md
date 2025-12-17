TEST CASE ID: INT-002
FEATURE: Intake / File Upload
MODULE: Storage / API

GOAL:
Uploads land in correct bucket.

SETUP:
- Project in 'intake' stage.
- Valid Client ID.
- Dummy file (text or image).

STEPS:
1. Call POST /api/intake/submit with Multipart FormData including 'reference_images'.
2. API should upload file to 'references' bucket under '{project_id}/{timestamp}_{random}.ext'.
3. API returns 200.
4. Verify Storage:
   - File exists in 'references' bucket.
   - Project/Intake record contains the file path/URL.

EXPECTED RESULT:
- Upload success.
- File retrievable from storage.
