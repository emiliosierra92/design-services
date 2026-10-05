# Contact form email setup

The form is wired to send inquiries to **emiliomsierra@outlook.com** through Resend. It becomes enabled when the server has a Resend API key and sender address. Without them it reports that delivery is unavailable and does not claim an inquiry was sent.

## Enable delivery

1. Create or use a [Resend account](https://resend.com).
2. [Verify a domain you control](https://resend.com/docs/dashboard/domains/introduction) by adding the DNS records Resend supplies. The sender needs that verified domain; the recipient can remain the Outlook address.
3. Create a sending API key in Resend.
4. Copy `.env.example` to `.env.local` and enter the private values there:
   - `RESEND_API_KEY`: your sending API key.
   - `INQUIRY_FROM_EMAIL`: a sender on the verified domain, optionally `Emilio Sierra <inquiries@your-verified-domain>`.
   - `INQUIRY_SITE_ORIGIN`: leave empty for local development; set the deployed canonical origin, such as `https://emiliosierra.com`, without a trailing slash when deploying there.
5. Restart the local server. For a deployed site, add the same values to the hosting environment and redeploy when authorized. Keep the API key out of chat, screenshots and source control.
6. Submit a real inquiry and confirm it arrives in Outlook, including the junk folder. Reply to that message to verify that the response goes to the visitor’s email address.

The recipient is fixed in `src/lib/inquiry-email.ts`; a visitor cannot change the recipient or sender. The visitor’s address is used as `reply_to`, following [Resend’s sending API](https://resend.com/docs/api-reference/emails/send-email).

## If the site is already on Vercel

Adding `RESEND_API_KEY` alone does not enable the form. In the project's Vercel environment settings, also add `INQUIRY_FROM_EMAIL` using an address on your Resend-verified domain. Apply both variables to the Production environment, then redeploy so the new deployment receives them. The Outlook address is the recipient, not the sender; do not use `emiliomsierra@outlook.com` as `INQUIRY_FROM_EMAIL`.

`INQUIRY_SITE_ORIGIN` is optional: when unset, the endpoint checks submissions against the request's own origin. If you set it, use the exact public origin visitors use, with no path or trailing slash. A different origin will be rejected.

After redeployment, open `/start-a-project`. The Send inquiry button should be enabled. Submit a test inquiry and check both the Resend email logs and your Outlook inbox/junk folder. A success message confirms provider acceptance; inbox arrival must be verified separately.

## Behavior

- Name, email, service selection and project message are validated in both the browser and server. Optional company and timeline are included in the email.
- The email is plain text. API credentials, provider errors and the recipient configuration remain on the server.
- Pending submissions disable the button. Failed submissions retain the fields. Repeating the same submission reuses its [idempotency key](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Success means the provider accepted the send request; it does not prove inbox delivery. Live inbox/reply-to and failure-path verification still needs configured credentials.
- Same-origin checks, a honeypot, a bounded request body and per-process rate limits are implemented. Limits are five attempts per email per hour and thirty total per process per hour. Limits reset on restart and are not shared between hosting instances; configure a shared or hosting-platform rate limit before exposing a scaled deployment.
- The form supports English and Spanish with accessible validation and status focus. It does not save an inquiry database; the email provider and recipient mailbox process and retain the email according to their settings. Review the final privacy disclosure before public launch.

## Checks

Run server tests with `npx playwright test --config tests/inquiry-unit.config.ts`. They mock email delivery and do not send messages. `tests/inquiry-ui.spec.ts` is gated by `INQUIRY_UI_TEST=1`; run it on an isolated test server with dummy credentials and mocked `/api/inquiry` responses, never as an actual send test with production credentials.
