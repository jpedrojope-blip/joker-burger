# Joker Burger e Beer

Website and local ordering MVP for Joker Burger e Beer, adapted from the original Nomadico clone structure.

The site uses the Joker palette, restaurant imagery, a local catalog, a first-party cart, checkout, order storage, and a local management panel. The external ordering service is no longer required for the main customer flow.

Run locally:

```powershell
node dev-server.js
```

Open `http://127.0.0.1:4173/`.

The local server is for development only and must not be exposed to the public internet.

Scope: visual layout, local source assets, responsive behavior, native horizontal rails, mobile menu, language menu, review carousel, and reduced-motion fallback. Booking, newsletter delivery, analytics, and WhatsApp destination remain demo links.

Local ordering MVP:

- `cardapio.html` — catalog, product customization, cart, highlights, and local checkout entry point.
- `checkout.html` — customer details, delivery or pickup, payment preference, order confirmation, and local order persistence.
- `admin.html` — protected local dashboard for approving, rejecting, deleting and advancing orders, plus adding, editing, hiding and deleting catalog products. It also includes financial indicators (revenue, estimated costs, gross profit and average ticket) and a simple CRM grouped by customer name/phone.

When deployed to Vercel, `vercel.json` exposes the friendly admin route `/admin`, so the panel can be opened at `https://your-domain.vercel.app/admin`.

Admin authentication is handled by Vercel Functions with an HTTP-only, signed session cookie. Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in Vercel using `.env.example` as a template. No admin password is stored in the public repository. Product costs and average delivery cost must be filled in for the profit estimate to be meaningful.

Orders, store settings and catalog changes are synchronized through the Vercel-connected Upstash Redis database using `KV_REST_API_URL` and `KV_REST_API_TOKEN`. The Upstash Redis integration must be connected to the Vercel project before deploying the multi-device ordering flow. The browser `localStorage` remains only as a cart/cache fallback; it is no longer the source of truth for orders.

The catalog, orders and CRM are still stored in browser `localStorage` in this MVP. That keeps the customer flow independent from Anota, but a real multi-device operation still needs a database-backed API for orders and catalog writes.
