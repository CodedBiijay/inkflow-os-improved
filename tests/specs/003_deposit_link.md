TEST CASE ID: DEP-001
FEATURE: Deposits
MODULE: Payments / API

GOAL:
Ensure deposit link is created correctly.

SETUP:
- Seed booking with status 'deposit_due'.

STEPS:
1. Call POST /api/deposits/create-payment-link with { bookingId }.
2. Verify response contains { url }.
3. Check database: booking.deposit_link is updated.

EXPECTED RESULT:
- Valid Stripe test link returned (starts with https://checkout.stripe.com...).
- DB updated with the link.
