TEST CASE ID: APP-001
FEATURE: Project Management / Approval
MODULE: API / Database

GOAL:
Approval should update primary project workflow.

SETUP:
- Project exists.
- Current status is 'design' or 'pending'.

STEPS:
1. Call PATCH /api/projects/approve:
   - project_id
   - approval_status: 'approved'

2. Inspect DB:
   - projects.approval_status = 'approved'
   - projects.status = 'approved'
   - project_messages has new row (System confirmation).


SCENARIO 2: Changes Requested
1. Call PATCH /api/projects/approve:
   - project_id
   - approval_status: 'changes_requested'

2. Inspect DB:
   - projects.approval_status = 'changes_requested'
   - projects.status = 'design' (Reverts to design phase)
   - project_messages has new row (System alert).

EXPECTED RESULT:
- API returns 200.
- Project status auto-reverts to 'design'.
