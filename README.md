DAT Colour Multimedia Pricing Site
==================================

A lightweight browser-based pricing and customer service brochure for DAT Colour Multimedia. The app runs as static HTML, CSS, and JavaScript, so it can be opened directly in a browser without installing dependencies.

Features
--------

- Configure services under General Printing, Souvenirs, Framing, and Branding.
- Persist service edits in the browser with `localStorage`.
- Generate a customer-facing brochure page with `customer.html`.
- Maintain a price list with editable service names, descriptions, units, and prices.
- Build quick estimates with the calculator and save reusable presets.
- Keep the customer brochure responsive for desktop and mobile.

Project Structure
-----------------

```text
.
├── index.html
├── customer.html
├── functions
│   └── api
│       └── catalog.js
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

- `index.html`: Admin/configure page markup, external font/icon imports, and script loading order.
- `customer.html`: Customer-facing brochure entrypoint that reuses the shared CSS and service rendering logic.
- `functions/api/catalog.js`: Cloudflare Pages Function for shared catalog reads and token-protected admin writes.
- `assets/css/styles.css`: All visual styling, responsive rules, customer brochure layout, cards, modals, and animations.
- `assets/js/data.js`: The `window.DatApp` namespace, default service data, category metadata, preset defaults, normalization, localStorage keys, and app state.
- `assets/js/navigation.js`: Main tab switching and service category switching.
- `assets/js/services.js`: Service rendering, price list rendering, add/edit/delete behavior, save banner, and add-service modal.
- `assets/js/calculator.js`: Quote calculator, totals, and preset management.
- `assets/js/customer-view.js`: Customer share link, customer brochure category toggles, customer-mode detection, and toast messages.
- `assets/js/app.js`: App startup and delegated event binding.
- `tests/persistence.test.html`: Browser-openable persistence test harness.

How To Use
----------

Open `index.html` in a browser.

Use the main tabs:

- `Services`: View service cards and generate the customer link.
- `Price List`: Add, edit, delete, and save service details.
- `Calculator`: Build a quote and save presets.

Customer View
-------------

The customer page uses the same service data from the configure page.

To open it manually:

```text
customer.html
```

The `Send to Customer` button creates this link and copies it to the clipboard. Old `index.html?view=customer` links are still supported temporarily.

Persistence
-----------

Data is stored in the browser's `localStorage` first.

- Services are stored under `dat_services`.
- Presets are stored under `dat_presets`.
- The Cloud admin token is stored under `dat_admin_token`.

When deployed on Cloudflare Pages with the KV binding below, the app also supports shared online data:

- `customer.html` reads the published cloud catalog from `/api/catalog`.
- `index.html` can publish services and presets to `/api/catalog`.
- Admin cloud writes require the secret token configured as `ADMIN_TOKEN`.

Cloudflare Pages Setup
----------------------

Use these Pages settings:

```text
Framework preset: None
Build command: leave empty
Build output directory: .
Root directory: project root
```

Create a Cloudflare KV namespace and bind it to the Pages project:

```text
Binding name: DAT_CATALOG
```

Add an environment variable or secret:

```text
ADMIN_TOKEN=<your private admin token>
```

After deployment:

1. Open `index.html`.
2. Go to `Price List`.
3. Enter the Cloud admin token.
4. Click `Save Token`.
5. Edit services or presets.
6. Click `Save to Cloud`.

The customer page will then load the shared cloud catalog. If Cloudflare KV is not configured or the site is opened directly from disk, the app falls back to browser-local data.

Development Notes
-----------------

- Keep the script order in `index.html` unchanged unless you also update dependencies between files.
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

The test backs up the current browser storage, verifies custom services and presets survive normalization/reload, then restores the original storage values.
