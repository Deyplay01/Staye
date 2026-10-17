# Staye deployment

## Vercel frontend

Configure the Vercel project to use `staye-frontend` as its root directory, with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL=https://staye-backend.onrender.com/api`
  - `VITE_GOOGLE_CLIENT_ID=<the same Google OAuth client ID configured on the backend>`

Vite variables are embedded into the frontend at build time. Redeploy after changing either value. Keep the existing SPA rewrite in `staye-frontend/vercel.json` so deep links such as `/admin/users` resolve to the React app.
The production build requires `VITE_API_BASE_URL` to be an absolute HTTPS backend URL; it rejects localhost or other non-HTTPS values instead of sending production traffic to a developer machine.

## Render backend

Configure the existing Render web service to use `backend` as its root directory, `npm install` as its build command, and `npm start` as its start command. Set these environment variables in Render's private environment settings:

- `NODE_ENV=production`
- `MONGODB_URI=<production MongoDB connection string>`
- `JWT_SECRET=<long, unique, cryptographically random secret>`
- `FRONTEND_URL=https://staye.vercel.app`
- `GOOGLE_CLIENT_ID=<same OAuth client ID as Vercel>`
- `PAYSTACK_SECRET_KEY=<Paystack secret key>`
- `PAYSTACK_PUBLIC_KEY=<Paystack public key>`
- `PAYSTACK_CURRENCY=NGN` (or the currency configured in Paystack)
- `PAYSTACK_CALLBACK_URL=https://staye.vercel.app/payment/callback` (optional; if omitted, the backend builds this from `FRONTEND_URL`)
- `CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<Cloudinary API key>`
- `CLOUDINARY_API_SECRET=<Cloudinary API secret>`

Do not add the removed `ADMIN_REGISTRATION_KEY`. Do not put private values in Vercel variables, committed files, or client-prefixed `VITE_` variables.

The Render service should use `/health/ready` as its health-check path. The endpoint returns success only after MongoDB is connected. `/health/live` is a simple process liveness endpoint. In production, payment callbacks must use HTTPS and cannot target localhost; if `PAYSTACK_CALLBACK_URL` is invalid or still points to localhost, the backend falls back to the callback path on the first configured `FRONTEND_URL` origin.

### Cloudinary image storage

Create a Cloudinary account and add its cloud name, API key, and API secret to the Render backend's private environment settings. The API secret must never be configured in Vercel or exposed through a `VITE_` variable. New profile and listing images are uploaded to Cloudinary; uploads are limited to 10 images per request, 5 MB per image, and 20 MB total.

No Render persistent disk is needed for new uploads. Existing database references to `/uploads/...` still depend on their original local files, served by the legacy `/uploads` route. Keep those files available or migrate the existing image references to Cloudinary before removing their storage; the application does not automatically delete legacy media.

#### Migrate existing local images

The backend includes a resumable migration script for old `/uploads/...` image references in listings, rooms, and profile avatars. It must be run from a trusted computer that has **both** the production MongoDB URI and a complete copy of the old upload directory. If the old files only existed on Render's ephemeral filesystem and are no longer present, restore them from a backup first; the script cannot recover missing files from their old URLs.

1. Back up the production database and the original upload files. Configure `MONGODB_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and, if needed, `UPLOADS_DIR` in the backend's private local environment. Do not commit `.env`.
2. From the `backend` directory, run a read-only dry run. It checks for the referenced files and supported image formats without uploading or changing database records:

   ```powershell
   npm run migrate:legacy-images
   ```

   Resolve any missing or invalid files it reports before proceeding. If the originals are in another location, set `UPLOADS_DIR` to that directory and repeat the dry run.
3. When the dry run finds the expected media, run the migration explicitly:

   ```powershell
   npm run migrate:legacy-images -- --execute
   ```

The script uploads media to Cloudinary and then updates the corresponding MongoDB image URLs. It uses deterministic Cloudinary asset IDs so an interrupted run can be safely repeated, checks that each database field has not changed during migration, and does not delete the original files. Review the script's completion counts and verify images in the application before removing legacy files or storage. New uploads can continue to use Cloudinary independently of this migration.

## Database rollout for the new roles

Back up the production database first. Run the one-time migration from the backend package against the production `MONGODB_URI` before routing live traffic to the new backend:

```powershell
Set-Location backend
$env:MONGODB_URI = Read-Host "Production MongoDB URI"
npm run migrate:user-roles
Remove-Item Env:MONGODB_URI
```

This maps legacy admin accounts to hosts, other legacy accounts to guests, and existing listings to approved. Run the super-admin bootstrap from a trusted operator machine with the production URI and a unique password of at least 12 characters; follow the commands in `staye-frontend/README.md`. Do not expose the bootstrap credentials as public service settings. Existing users should sign out and sign in again after rollout.

Database backfills are explicit operator-run commands; the API no longer scans and migrates all listings and bookings at every restart. If these legacy migrations have not already been run, back up the database and run the applicable commands once from `backend` before deploying:

```powershell
npm run migrate:legacy-listings
npm run migrate:booking-references
```

The legacy-listings migration creates a default room category only for listings without rooms. The booking-reference migration fills only missing public references. Review command output and resolve any reported errors before continuing.

## Google OAuth, Paystack, and smoke checks

In Google Cloud Console, create a **Web application** OAuth client. Add `https://staye.vercel.app` (and any development origin you use) as an authorized JavaScript origin. Set that same client ID as `VITE_GOOGLE_CLIENT_ID` in Vercel and `GOOGLE_CLIENT_ID` in Render, then redeploy both services after changes. Google sign-in uses the GIS popup credential flow, so no redirect URI is needed. Vercel sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` to support the popup flow.

After setting the environment and deploying:

1. Open `https://staye-backend.onrender.com/health/ready`; expect HTTP 200 and `database: "connected"`.
2. Open `https://staye.vercel.app`, sign up/log in as a guest, and check the browser console/network panel for failed API or CORS requests.
3. Register a public host, create a listing, confirm it remains hidden until reviewed, then approve it using the super-admin workspace at `/admin/users`.
4. Verify a host cannot access `/admin/users`, while the super admin can view accounts and block/unblock or flag/unflag a guest/host.
5. Test a real Paystack transaction in test mode before switching to live credentials, including the callback to `/payment/callback`.

The deployment endpoints could not be confirmed from this environment because requests to the Render service timed out. Recheck them after deployment and confirm Render/Vercel environment values in their dashboards.
