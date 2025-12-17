TEST CASE ID: ART-001
FEATURE: Project Management / Artist Uploads
MODULE: API / Storage

GOAL:
Artist uploads appear in project details.

SETUP:
- Project exists.
- Dummy image file.

STEPS:
1. Call POST /api/projects/upload-reference with Multipart FormData:
   - project_id
   - files (array of files)

2. Inspect DB:
   - projects.artist_reference_images contains new paths.

3. Verify Storage:
   - Files exist in 'references' bucket under '{project_id}/artist_{timestamp}_...'.

EXPECTED RESULT:
- API returns 200.
- DB array updated.
- Files stored.
