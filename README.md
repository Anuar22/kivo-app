# Kivo App

Kivo is a mobile-first food ordering app with customer ordering flows, account auth, and a vendor dashboard for managing incoming orders and menu availability.

## Scripts

- `npm run dev` - start the Vite client.
- `npm run dev:api` - start the Express API.
- `npm run db:migrate` - apply database migrations.
- `npm run build` - build the client for production.
- `npm run lint` - run ESLint.

## Environment

Copy `.env.example` to `.env` and set the database connection and JWT secret before running the API.

## App Shape

The client lives in `src/`, the API lives in `server/`, and schema migrations live in `server/migrations/`.
