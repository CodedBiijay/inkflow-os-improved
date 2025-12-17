TEST CASE ID: DEP-002
FEATURE: Deposits
MODULE: Sync Engine / Webhook

GOAL:
Deposit payment triggers status and project sync.

SETUP:
- Seed booking with status 'deposit_due'.
- Associate it with a project in 'intake'.

STEPS:
1. Fire test webhook event: charge.succeeded (or equivalent).
2. Inspect booking & project in DB.

EXPECTED RESULT:
- booking.status = 'confirmed'.
- project.status auto-advanced from 'intake' -> 'design'.
