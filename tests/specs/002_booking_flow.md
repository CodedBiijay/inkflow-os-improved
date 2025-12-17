TEST CASE ID: BKG-001
FEATURE: Booking
MODULE: BookingFlow / API

GOAL:
Ensure booking creation from BookingFlow works end-to-end.

SETUP:
- Seed client (ensure client exists in DB or create temp)
- Seed service (ensure valid service ID)
- Seed artist availability (ensure slots exist for target date)

STEPS:
1. Begin booking flow (simulate UI or API equivalent).
2. Select client -> service -> time.
3. Click "Confirm + Send Deposit Link" (Calls POST /api/bookings/create).
4. Inspect /api/bookings/create response.

EXPECTED RESULT:
- Booking row created in `bookings` table.
- status = 'deposit_due'.
- deposit_amount set correctly based on service.
- project created (or linked) in `projects` table.
