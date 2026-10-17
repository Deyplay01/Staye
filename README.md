# Staye

Staye is a web application for discovering and booking accommodation. Guests can browse listings, make bookings, manage their profiles, and complete payments. Hosts can publish and manage their own properties, while a super admin oversees account moderation and listing reviews.

## What the app includes

- Public accommodation listings with host-managed property and room information.
- Guest accounts for bookings, profile management, and booking receipts.
- Public host registration and tools to manage listings and bookings.
- Listing review: new or edited listing content remains hidden until approved.
- A super-admin workspace for reviewing listings and flagging or blocking guest and host accounts.
- Cloudinary-backed uploads for listing photos and profile images.
- Google sign-in and Paystack payment integration.

### Account roles

| Role | Capabilities |
| --- | --- |
| Guest | Browse accommodation, book stays, and manage a profile. |
| Host | Register publicly and manage their own listings and bookings. |
| Admin (super admin) | Review listings and view, flag, or block guest and host accounts. Super admins cannot moderate other super-admin accounts. |

## Technology

- **Frontend:** React, Vite, React Router, and Tailwind CSS.
- **Backend:** Node.js, Express, and MongoDB with Mongoose.
- **Media:** Cloudinary.
- **Payments:** Paystack.
- **Deployment:** Vercel for the frontend and Render for the backend.

## Repository layout

```text
backend/          Express API, MongoDB models, scripts, and tests
staye-frontend/   React application
DEPLOYMENT.md     Production deployment and rollout instructions
```

## Run locally

Use a supported Node.js installation and configure the required environment variables before starting the services.

1. Install backend dependencies and prepare the backend environment:

   ```powershell
   Set-Location backend
   npm install
   Copy-Item .env.example .env
   ```

   Set at least `MONGODB_URI` and `JWT_SECRET` in `backend/.env`. To use Google sign-in, Paystack, and image uploads locally, configure their corresponding values as described in [DEPLOYMENT.md](./DEPLOYMENT.md).

2. In a second terminal, install frontend dependencies and configure its environment:

   ```powershell
   Set-Location staye-frontend
   npm install
   Copy-Item .env.example .env
   ```

   Set `VITE_API_BASE_URL` to the backend API URL (for a local backend, `http://localhost:5000/api`) and provide the Google OAuth client ID if using Google sign-in.

3. Start the services in separate terminals:

   ```powershell
   Set-Location backend
   npm run dev
   ```

   ```powershell
   Set-Location staye-frontend
   npm run dev
   ```

The frontend and backend each have their own dependency manifest. Run `npm test` from `backend` to run the backend tests and `npm run build` from `staye-frontend` to build the production frontend.

## Production deployment

The deployment guide covers Vercel and Render configuration, required environment variables, Cloudinary setup, database role migration, and post-deployment checks: [DEPLOYMENT.md](./DEPLOYMENT.md).

Do not commit `.env` files or put private credentials in frontend `VITE_` variables. Cloudinary secrets, the JWT secret, database credentials, and Paystack's secret key belong only in the backend's private environment settings.

## Operational notes

Before deploying the role model to an existing database, back it up and follow the migration and super-admin bootstrap instructions in [DEPLOYMENT.md](./DEPLOYMENT.md) and [staye-frontend/README.md](./staye-frontend/README.md). To migrate legacy `/uploads/...` image references, restore the original files locally, back up the database, run `npm run migrate:legacy-images` from `backend` to perform a dry run, and then explicitly run `npm run migrate:legacy-images -- --execute`. The script updates listing, room, and profile image references but never deletes legacy files; consult the deployment guide for details.

The project does not currently provide password-account email verification, identity verification, or host payout onboarding. Add and configure suitable controls before relying on the application for verified identities or payouts.
