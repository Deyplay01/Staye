# Staye

Staye is a React + Vite frontend backed by the Express/MongoDB API.

## Setup

Install dependencies in `staye-frontend` and `backend`, configure their environment files, then start each package with its `dev` script. The frontend's `VITE_API_BASE_URL` should point to the backend API (for example, `http://localhost:5000/api`).

## Account roles and moderation

- **Guest:** uses booking and profile features.
- **Host:** registers publicly at `/admin/register` and manages their own listings and bookings. Host passwords must be at least 8 characters.
- **Admin (super admin):** created only through the backend bootstrap script. This role can review listings and view, flag, or block guest and host accounts; it cannot moderate another super-admin account.

Before deploying the new role model, run `npm run migrate:user-roles` from `backend`. The migration maps legacy `isAdmin` accounts to hosts, other accounts to guests, sets account status, and keeps existing listings approved. It is safe to rerun.

Create or promote the first super-admin using environment variables in the backend's private environment:

```powershell
$env:SUPER_ADMIN_EMAIL = Read-Host "Super-admin email"
$securePassword = Read-Host "Super-admin password (12+ characters)" -AsSecureString
$env:SUPER_ADMIN_PASSWORD = (New-Object System.Net.NetworkCredential("", $securePassword)).Password
npm run bootstrap:super-admin
Remove-Item Env:SUPER_ADMIN_EMAIL, Env:SUPER_ADMIN_PASSWORD
Remove-Variable securePassword
```

This sets the account's password and role. Keep these values out of source control and deployment logs. Existing sessions should sign out and back in after role migration/bootstrap. Host registration does not use `ADMIN_REGISTRATION_KEY`.

New listings and edits to listing content enter **pending review** and remain hidden from public browsing until approved. Room inventory and price changes do not unpublish an otherwise approved listing. Rejections include a reason that the host can see and address by editing and resubmitting. Blocking an account prevents further authenticated API access; blocked hosts' listings are hidden from public browsing.

## Operational notes

The app currently has no email-verification, identity-verification, or payout-onboarding provider configured. Google sign-in verifies the Google email, but password-based accounts are not email-verified. Configure those controls with the chosen provider before relying on them for production payouts or identity assurance. Listing review and account moderation are available in the super-admin workspace at `/admin/users`.

The application currently uses the existing booking, listing, profile, notification, and payment API routes. Payment onboarding and payment UX remain subject to the existing payment integration.
