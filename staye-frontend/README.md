# Staye — Frontend

React + Vite + Tailwind + React Router frontend, built against the **actual** Staye backend
(routes/models you provided) — no invented endpoints or fields.

## 1. Setup

```bash
cd frontend        # wherever you put these files in your repo
npm install
cp .env.example .env
npm run dev
```

Make sure your backend is running on the URL in `.env` (default `http://localhost:5000/api`).

## 2. ⚠️ Known backend blocker — bookings will fail until this is fixed

`routes/booking.js`'s `POST /` handler never sets `totalAmount`, but the `Booking` schema
requires it. **Every booking creation will throw a validation error (500) until this is fixed.**

Fix needed in your backend (not made by me, since you asked me not to touch it):

```js
// in routes/booking.js, inside POST "/"
const listing = await Listing.findById(listingId);
if (!listing) return res.status(404).json({ message: "Listing not found." });

const nights = Math.ceil((dates.end - dates.start) / (1000 * 60 * 60 * 24));
const totalAmount = nights * listing.price;

const newBooking = new Booking({
  listingId,
  userId: req.user.userId,
  checkIn: dates.start,
  checkOut: dates.end,
  totalAmount, // <-- add this
});
```

Until this is in place, the frontend will show a red error box on the booking review page —
that's expected, not a frontend bug.

## 3. What's built and connected to real data

**Customer:** browse listings (`/`), listing details with date pickers (`/listings/:id`),
register/login (`/register`, `/login`), review & confirm booking (`/booking/:listingId`),
confirmation page (`/confirmation/:id`), my bookings + cancel (`/my-bookings`).

**Admin:** separate admin login (`/admin/login`), dashboard (`/admin/dashboard`) showing only
real numbers (listing count, average price), full listings CRUD (`/admin/listings`).

## 4. What's intentionally NOT built (backend doesn't support it)

- **Admin can't view or manage other users' bookings.** `booking.js` has no `isAdmin` checks and
  no "list all bookings" route — only `/bookings/my-bookings` (the logged-in user's own) exists.
  Needs new backend routes, e.g. an admin-gated `GET /bookings` and `PATCH /bookings/:id/status`.
- **No "guests" field anywhere.** The `Booking` schema doesn't have one.
- **No booking "Completed" status.** Only `pending_payment`, `confirmed`, `cancelled` exist.
- **Payment (Paystack) isn't wired into the UI yet** — matches your original MVP note that
  payment comes later. The backend routes exist (`/payments/initialize`, `/payments/verify`)
  but aren't called from any page yet.

## 5. Assumed route prefixes

Confirmed by you: `/listings`, `/bookings` (both under `/api`). Assumed but not explicitly
confirmed: `/auth/register`, `/auth/login`, `/listings/my-listings`. If your `app.js` mounts
these under different prefixes, the only files that need updating are in `src/api/` —
nothing else references a URL string directly.

## 6. Test checklist (once MongoDB is connected)

1. `npm run dev`, open the printed localhost URL.
2. **Register** a normal account at `/register` → should redirect to home, logged in.
3. **Browse** listings on `/` — if none exist yet, you'll need to seed one via an admin account
   or a manual DB insert, since only admins can create listings.
4. Log in as an **admin** account at `/admin/login` (must already have `isAdmin: true` in the DB —
   there's no way to self-register as admin) → add a listing from `/admin/listings`.
5. As the customer account, open the new listing, pick dates, click **Reserve** → should land on
   the review page. Click **Confirm booking**.
   - If you see the red "500 error" message: that's the `totalAmount` backend bug above — expected
     until it's fixed.
   - Once fixed: should redirect to `/confirmation/:id` showing the booking.
6. Check `/my-bookings` — the booking should appear with status "Pending", with a **Cancel** button.
7. Log out, log back in as admin, edit and delete a listing from `/admin/listings` to confirm CRUD works.
8. Try booking without logging in first — should redirect to `/login`, then back to the booking
   page automatically after login.
