TEST CASE ID: BKG-003
FEATURE: Booking / Auto-Project
MODULE: Automation / API

GOAL:
Booking creation should auto-create project if missing.

SETUP:
- Seeded Artist, Client, Service.
- Ensure NO project ID is passed in request.

STEPS:
1. Call POST /api/bookings/create with valid booking details but WITHOUT project_id.
2. Inspect Response: should contain booking with a valid project_id.
3. Inspect DB:
   - New project exists with ID from booking.
   - Project status = 'session_scheduled'.
   - Project title = 'New Booking Project' (default).
   - Project linked to client and service correctly.

EXPECTED RESULT:
- Booking created successfully.
- Project created automatically and linked.
- Status is 'session_scheduled'.
