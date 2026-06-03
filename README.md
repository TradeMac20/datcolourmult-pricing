DAT Colour Multimedia Pricing Site
==================================

A lightweight browser-based pricing and customer service brochure for DAT Colour Multimedia. The app runs as static HTML, CSS, and JavaScript, so it can be opened directly in a browser without installing dependencies.

Features
--------

- Configure services under General Printing, Souvenirs, Framing, and Branding.
- Persist service edits to Cloudflare KV.
- Serve the customer-facing brochure from `/customer/page/`.
- Maintain a price list with editable service names, descriptions, units, and prices.
- Build quick estimates with the calculator and save reusable presets.
- Keep the customer brochure responsive for desktop and mobile.

Project Structure
-----------------

```text
.
├── index.html
├── customer
│   └── page
│       └── index.html
├── admin
│   └── view
│       └── index.html
├── functions
│   └── api
│       └── catalog.js
├── wrangler.toml
├── README.md
├── tests
│   └── persistence.test.html
└── assets
    ├── css
    │   └── styles.css
    └── js
        ├── app.js
        ├── calculator.js
        ├── customer-view.js
        ├── data.js
        ├── navigation.js
        └── services.js
```

File Responsibilities
---------------------

- `index.html`: Lightweight status page for domain health checks.
- `customer/page/index.html`: Customer-facing brochure entrypoint.
- `admin/view/index.html`: Admin/configure page markup, external font/icon imports, and script loading order.
- `functions/api/catalog/index.js`: Cloudflare Pages Function for shared catalog reads and token-protected admin writes.
- `functions/customer.js`: Explicit 404 guard for `/customer` and `/customer/`; the customer page is only `/customer/page/`.
- `wrangler.toml`: Cloudflare Pages configuration, including the KV namespace binding.
- `assets/css/styles.css`: All visual styling, responsive rules, customer brochure layout, cards, modals, and animations.
- `assets/js/data.js`: The `window.DatApp` namespace, default service data, category metadata, preset defaults, normalization, cloud catalog sync, and app state.
- `assets/js/navigation.js`: Main tab switching and service category switching.
- `assets/js/services.js`: Service rendering, price list rendering, add/edit/delete behavior, save banner, and add-service modal.
- `assets/js/calculator.js`: Quote calculator, totals, and preset management.
- `assets/js/customer-view.js`: Customer share link, customer brochure category toggles, customer-mode detection, and toast messages.
- `assets/js/app.js`: App startup and delegated event binding.
- `tests/persistence.test.html`: Browser-openable persistence test harness.

How To Use
----------

Open `admin/view/index.html` in a browser.

Use the main tabs:

- `Services`: View service cards and generate the customer link.
- `Price List`: Add, edit, delete, and save service details.
- `Calculator`: Build a quote and save presets.

Customer View
-------------

The customer page uses the same service data from the configure page. On Cloudflare Pages, the brochure lives at:

To open it manually:

```text
/customer/page/
```

The `Send to Customer` button creates this customer-page link and copies it to the clipboard. Old `?view=customer` links are still forwarded to the customer page temporarily.

Persistence
-----------

Data is stored in Cloudflare KV through the `/api/catalog` Pages Function. The admin page no longer stores services, presets, or the admin token in browser `localStorage`.

When deployed on Cloudflare Pages with the KV binding below:

- `customer/page/index.html` reads the published cloud catalog from `/api/catalog`.
- `admin/view/index.html` can publish services and presets to `/api/catalog`.
- Admin writes require the secret token configured as `ADMIN_TOKEN`.
- Admin edits auto-save to KV after the token is entered for the current session.

Cloudflare Pages Setup
----------------------

Use these Pages settings:

```text
Framework preset: None
Build command: leave empty
Build output directory: .
Root directory: project root
```

The KV namespace is configured in `wrangler.toml`:

```text
Binding name: KV
Namespace ID: 5c25a55b3a10411a9f99cb644df41266
```

The function also accepts `DAT_CATALOG`, but this repo now uses `KV` in Wrangler config.

Add an environment variable or secret:

```text
ADMIN_TOKEN=<your private admin token>
```

After deployment:

1. Open `/admin/view/`.
2. Go to `Price List`.
3. Enter the Cloud admin token.
4. Click `Set Token`.
5. Edit services or presets. Changes auto-save to Cloudflare KV.

The customer page will then load the shared cloud catalog. If Cloudflare KV is not configured or the site is opened directly from disk, changes will not persist.

Development Notes
-----------------

- Keep the script order in `admin/view/index.html` unchanged unless you also update dependencies between files.
- The app intentionally uses one plain JavaScript global: `window.DatApp`.
- HTML events are bound through delegated listeners in `assets/js/app.js` using `data-action` attributes.
- Fonts and icons load from CDNs, with CSS fallbacks for readable system fonts if the font CDN is unavailable.
- Cloud sync uses the same-origin `/api/catalog` endpoint, so it works on Cloudflare Pages and local static servers with Pages Functions support.
- No build step is required.

Testing
-------

Open this file in a browser and click `Run Tests`:

```text
tests/persistence.test.html
```

The test verifies catalog normalization and confirms service persistence queues a cloud save without browser local storage.
