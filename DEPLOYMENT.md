# Staye deployment

## Vercel frontend

Configure the Vercel project to use `staye-frontend` as its root directory, with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_BASE_URL=https://staye-backend.onrender.com/api`
  - `VITE_GOOGLE_CLIENT_ID=<the same Google OAuth client ID configured on the backend>`

Vite variables are embedded into the frontend at build time. Redeploy after changing either value. Keep the existing SPA rewrite in `staye-frontend/vercel.json` so deep links such as `/admin/users` resolve to the React app.

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
- `PAYSTACK_CALLBACK_URL=https://staye.vercel.app/payment/callback`
- `CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<Cloudinary API key>`
- `CLOUDINARY_API_SECRET=<Cloudinary API secret>`

Do not add the removed `ADMIN_REGISTRATION_KEY`. Do not put private values in Vercel variables, committed files, or client-prefixed `VITE_` variables.

The Render service should use `/health/ready` as its health-check path. The endpoint returns success only after MongoDB is connected. `/health/live` is a simple process liveness endpoint.

### Cloudinary image storage

Create a Cloudinary account and add its cloud name, API key, and API secret to the Render backend's private environment settings. The API secret must never be configured in Vercel or exposed through a `VITE_` variable. New profile and listing images are uploaded to Cloudinary; uploads are limited to 10 images per request, 5 MB per image, and 20 MB total.

No Render persistent disk is needed for new uploads. Existing database references to `/uploads/...` still depend on their original local files, served by the legacy `/uploads` route. Keep those files available or migrate the existing image references to Cloudinary before removing their storage; the application does not automatically migrate or delete legacy media.

## Database rollout for the new roles

Back up the production database first. Run the one-time migration from the backend package against the production `MONGODB_URI` before routing live traffic to the new backend:

```powershell
Set-Location backend
$env:MONGODB_URI = Read-Host "Production MongoDB URI"
npm run migrate:user-roles
Remove-Item Env:MONGODB_URI
```

This maps legacy admin accounts to hosts, other legacy accounts to guests, and existing listings to approved. Run the super-admin bootstrap from a trusted operator machine with the production URI and a unique password of at least 12 characters; follow the commands in `staye-frontend/README.md`. Do not expose the bootstrap credentials as public service settings. Existing users should sign out and sign in again after rollout.

## Google OAuth, Paystack, and smoke checks

In Google Cloud Console, ensure the OAuth client allows the JavaScript origin `https://staye.vercel.app` (and any development origin you still use). Use the same client ID in Render and Vercel.

After setting the environment and deploying:

1. Open `https://staye-backend.onrender.com/health/ready`; expect HTTP 200 and `database: "connected"`.
2. Open `https://staye.vercel.app`, sign up/log in as a guest, and check the browser console/network panel for failed API or CORS requests.
3. Register a public host, create a listing, confirm it remains hidden until reviewed, then approve it using the super-admin workspace at `/admin/users`.
4. Verify a host cannot access `/admin/users`, while the super admin can view accounts and block/unblock or flag/unflag a guest/host.
5. Test a real Paystack transaction in test mode before switching to live credentials, including the callback to `/payment/callback`.

The deployment endpoints could not be confirmed from this environment because requests to the Render service timed out. Recheck them after deployment and confirm Render/Vercel environment values in their dashboards.
