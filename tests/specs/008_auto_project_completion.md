TEST CASE ID: PRJ-002
FEATURE: Booking / Auto-Completion
MODULE: Automation / API

GOAL:
When a booking is marked completed, the project should complete IF no more sessions exist.

SETUP:
- Project in 'session_scheduled'.
- One Booking linked to Project.

STEPS:
1. Call PATCH /api/bookings/update-status with:
   - booking_id
   - status = 'completed'
2. Inspect DB:
   - Booking status = 'completed'.
   - Project status should normally become 'completed' (assuming no future bookings exist).

VARIATION (Multiple Sessions):
- If another booking exists in future, Project status should REMAIN 'session_scheduled'.

EXPECTED RESULT:
- Single booking -> Project completes.
- Multiple bookings -> Project stays open.
