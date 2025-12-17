TEST CASE ID: MSG-001
FEATURE: Messaging and Approval
MODULE: Projects / API

GOAL:
Validate the artist-client messaging loop and key approval workflows (Approve / Request Changes).

SETUP:
- Migration `007_messaging_approval.sql` must be applied.
- A project must exist (e.g., from Booking flow).

STEPS:
1. Open Project Details Modal as Artist.
2. Navigate to "Messages" tab.
3. Send a message "Here is the first draft".
4. Artist copies "Approval Link" and opens it (simulating Client).
5. Client views "Design Approval" page.
6. Client clicks "Approve Designs".
7. Return to Project Board/Modal.

EXPECTED RESULT:
- Message "Here is the first draft" appears in the message thread.
- On Approval Page, designs (if any) are visible.
- After clicking Approve, Project Status updates to 'approved'.
- Project Details Modal shows "Approval: approved" badge.
- Project Board moves card to "Approved" column (if automated).
