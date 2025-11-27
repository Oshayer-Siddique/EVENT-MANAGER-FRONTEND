This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables

Copy `.env.local` as needed (it is already ignored by git) and update the following keys before running the app:

```
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

For deployments, set the same variables—`NEXT_PUBLIC_API_BASE_URL` should point at your production backend, the Cloudinary values must match your account, and Stripe requires the publishable key for the live project.

## Ticket Purchase Flow

1. Navigate to an event detail page (`/events/:eventId`). The hero section includes full event metadata, ticket tiers, and a rich seat map grouped by section and row.
2. Pick available seats (green). Selections appear in the reservation summary card, including tier names and live pricing. You can clear any seat inline or continue browsing the venue layout by tier, section, or row.
3. Click **Proceed to Checkout** to reserve the seats. The frontend calls `/api/holds` to create a 15-minute reservation window and forwards you to `/checkout?holdId=...`.
4. Confirm the reservation on the checkout page. You will see the held seats, total price, and a countdown. Use **Pay & Issue Tickets** to convert the hold (mock payment identifier) via `/api/holds/convert`, or **Release Hold** to give the seats back to inventory.
5. After conversion you are redirected to `/profile/tickets`, where issued tickets can be managed.

All API calls are proxied through `src/services/*` using `apiClient`, which automatically attaches the JWT stored in `localStorage`.
