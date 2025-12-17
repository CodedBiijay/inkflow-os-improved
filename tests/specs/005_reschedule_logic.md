TEST CASE ID: BKG-002
FEATURE: Booking / Reschedule
MODULE: Calibration / API

GOAL:
Rescheduling updates DB without breaking project stage.

SETUP:
- Existing booking (e.g. from BKG-001).
- Associated project.

STEPS:
1. Call PATCH /api/bookings/update-time with:
   - booking_id
   - new start_time
   - new end_time
2. Confirm times updated in `bookings` table.
3. Confirm `projects` table `status` is UNCHANGED.

EXPECTED RESULT:
- Booking times updated.
- Project status remains as is (e.g. 'design' or 'deposit_due'), specifically NOT resetting to 'intake' or unexpected state.
