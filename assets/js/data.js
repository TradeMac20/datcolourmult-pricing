// =================== DAT APP STATE ===================
(function () {
  const STORAGE_KEYS = {
    services: 'dat_services',
    presets: 'dat_presets',
    adminToken: 'dat_admin_token',
  };

  const CLOUD_CATALOG_ENDPOINT = '/api/catalog';

  const DEFAULT_DATA = {
    printing: [
      { id: 'p1', name: 'Coloured/Black & White printing', price: 2.00, unit: 'per page', desc: 'Full colour and black & white printing' },
      { id: 'p3', name: 'Photocopy', price: 0.30, unit: 'per page', desc: 'Standard photocopy' },
      { id: 'p4', name: 'Scanning', price: 1.00, unit: 'per page', desc: 'Document scanning' },
      { id: 'p5', name: 'Lamination', price: 3.00, unit: 'per sheet', desc: 'Gloss or matte lamination' },
      { id: 'p6', name: 'Posters', price: 15.00, unit: 'per piece', desc: 'Large format poster print' },
      { id: 'p7', name: 'Banners', price: 50.00, unit: 'per banner', desc: 'Vinyl & fabric banners' },
      { id: 'p8', name: 'Stickers', price: 5.00, unit: 'per sheet', desc: 'Custom sticker sheets' },
    ],
    souvenirs: [
      { id: 's1', name: 'T-shirt printing', price: 35.00, unit: 'per piece', desc: 'Custom graphic tees' },
      { id: 's2', name: 'Invitation Cards', price: 8.00, unit: 'per set', desc: 'Printed invitation sets' },
      { id: 's3', name: 'Brochures', price: 6.00, unit: 'per piece', desc: 'Tri-fold or bi-fold' },
      { id: 's4', name: 'Key Holders/ Mugs/ Pen/Face Towel', price: 10.00, unit: 'per piece', desc: 'Custom souvenir items' },
      { id: 's5', name: 'Lamination', price: 4.00, unit: 'per sheet', desc: 'Souvenir lamination' },
    ],
    framing: [
      { id: 'f1', name: 'Glass Framing', price: 40.00, unit: 'per frame', desc: 'Standard glass frame' },
      { id: 'f2', name: 'New Lamination', price: 12.00, unit: 'per piece', desc: 'Fresh lamination service' },
      { id: 'f3', name: 'Old Lamination', price: 8.00, unit: 'per piece', desc: 'Old lamination service' },
      { id: 'f4', name: 'Canvas Mount', price: 60.00, unit: 'per piece', desc: 'Canvas stretched & mounted' },
    ],
    branding: [
      { id: 'b1', name: 'Indoor and Outdoor Branding', price: 120.00, unit: 'per sqm', desc: 'Indoor and outdoor branding' },
    ]
  };

  const CAT_META = {
    printing: { label: 'General Printing', badge: 'badge-printing' },
    souvenirs: { label: 'Souvenirs', badge: 'badge-souvenirs' },
    framing:   { label: 'Framing',   badge: 'badge-framing' },
    branding:  { label: 'Branding',  badge: 'badge-branding' },
  };

  const DEFAULT_PRESETS = [
    { name: 'Starter Package', items: { p1: 5, p3: 10, s3: 20 } },
    { name: 'Event Pack', items: { p6: 2, p7: 1, s2: 50, b1: 4 } },
    { name: 'Office Bundle', items: { p1: 100, p4: 20, p5: 5, s3: 50 } },
  ];

  const CUSTOMER_SERVICE_IDS = {
    printing: ['p1', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
    souvenirs: ['s1', 's2', 's3', 's4', 's5'],
    framing: ['f1', 'f2', 'f3', 'f4'],
    branding: ['b1'],
  };

  const CATEGORY_ORDER = Object.keys(CUSTOMER_SERVICE_IDS);

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function readJSON(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function normalizeLegacyService(cat, svc) {
    const defaults = DEFAULT_DATA[cat] || [];
    const byId = Object.fromEntries(defaults.map(item => [item.id, item]));
    const oldName = svc.name || '';

    if (cat === 'printing') {
      if (svc.id === 'p1' && oldName === 'Coloured Printing') return cloneData(byId.p1);
      if (svc.id === 'p2' && oldName === 'Black & White Printing') return null;
    }

    if (cat === 'souvenirs') {
      if (svc.id === 's1' && oldName === 'T-Shirt Printing') return cloneData(byId.s1);
      if (svc.id === 's4' && oldName === 'Key Holders') return cloneData(byId.s4);
      if (svc.id === 's5' && oldName === 'Mugs') return null;
      if (svc.id === 's6' && oldName === 'Pen Printing') return null;
      if (svc.id === 's7' && oldName === 'Face Towels') return null;
      if (svc.id === 's8' && oldName === 'Lamination (Souvenirs)') return cloneData(byId.s5);
    }

    if (cat === 'framing' && svc.id === 'f3' && oldName === 'Old Lamination Removal') {
      return cloneData(byId.f3);
    }

    if (cat === 'branding') {
      if (svc.id === 'b1' && oldName === 'Indoor Branding') return cloneData(byId.b1);
      if (svc.id === 'b2' && oldName === 'Outdoor Branding') return null;
      if (svc.id === 'b3' && oldName === 'Logo Design') return null;
      if (svc.id === 'b4' && oldName === 'Signage') return null;
    }

    return svc;
  }

  function normalizeServiceCatalog(source) {
    if (!source) return cloneData(DEFAULT_DATA);
    return CATEGORY_ORDER.reduce((next, cat) => {
      const byId = new Map();
      (source[cat] || []).forEach(svc => {
        const normalized = normalizeLegacyService(cat, svc);
        if (normalized) byId.set(normalized.id, normalized);
      });
      next[cat] = Array.from(byId.values());
      return next;
    }, {});
  }

  function normalizePresets(source, catalog) {
    if (!source) return cloneData(DEFAULT_PRESETS);
    const allowedIds = new Set(Object.values(catalog).flat().map(svc => svc.id));
    return source.map(preset => {
      const items = {};
      Object.entries(preset.items || {}).forEach(([id, qty]) => {
        if (allowedIds.has(id)) items[id] = qty;
      });
      return { ...preset, items };
    });
  }

  function createState(storage) {
    const targetStorage = storage || window.localStorage;
    const storedServices = readJSON(targetStorage, STORAGE_KEYS.services);
    const services = normalizeServiceCatalog(storedServices);

    if (storedServices && JSON.stringify(storedServices) !== JSON.stringify(services)) {
      targetStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
    }

    const storedPresets = readJSON(targetStorage, STORAGE_KEYS.presets);
    const presets = normalizePresets(storedPresets, services);

    if (storedPresets && JSON.stringify(storedPresets) !== JSON.stringify(presets)) {
      targetStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(presets));
    }

    return {
      services,
      presets,
      calcQty: {},
      activePreset: null,
      isDirty: false,
    };
  }

  const DatApp = {
    STORAGE_KEYS,
    DEFAULT_DATA,
    CAT_META,
    DEFAULT_PRESETS,
    CUSTOMER_SERVICE_IDS,
    CATEGORY_ORDER,
    CLOUD_CATALOG_ENDPOINT,
    state: createState(),
    cloneData,
    normalizeLegacyService,
    normalizeServiceCatalog,
    normalizePresets,
    createState,
    persistServices(storage) {
      const targetStorage = storage || window.localStorage;
      targetStorage.setItem(STORAGE_KEYS.services, JSON.stringify(DatApp.state.services));
    },
    persistPresets(storage) {
      const targetStorage = storage || window.localStorage;
      targetStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(DatApp.state.presets));
    },
    persistCatalog(storage) {
      DatApp.persistServices(storage);
      DatApp.persistPresets(storage);
    },
    catalogPayload() {
      return {
        services: DatApp.state.services,
        presets: DatApp.state.presets,
      };
    },
    canUseCloudApi() {
      return window.location.protocol !== 'file:';
    },
    getAdminToken() {
      return window.localStorage.getItem(STORAGE_KEYS.adminToken) || '';
    },
    setAdminToken(token) {
      window.localStorage.setItem(STORAGE_KEYS.adminToken, token);
    },
    applyCatalog(catalog) {
      if (!catalog || !catalog.services) return false;
      DatApp.state.services = normalizeServiceCatalog(catalog.services);
      DatApp.state.presets = normalizePresets(catalog.presets || DEFAULT_PRESETS, DatApp.state.services);
      DatApp.persistCatalog();
      return true;
    },
    async loadCloudCatalog(options) {
      const settings = options || {};
      if (!DatApp.canUseCloudApi()) {
        if (!settings.silent) DatApp.updateCloudStatus('Cloud sync needs the deployed site or a local server.', 'warn');
        return false;
      }

      try {
        if (!settings.silent) DatApp.updateCloudStatus('Loading cloud catalog...', 'busy');
        const response = await fetch(CLOUD_CATALOG_ENDPOINT, { cache: 'no-store' });

        if (response.status === 404) {
          if (!settings.silent) DatApp.updateCloudStatus('No cloud catalog yet. Save to Cloud to publish one.', 'warn');
          return false;
        }

        if (!response.ok) throw new Error('Cloud catalog request failed');

        const catalog = await response.json();
        const applied = DatApp.applyCatalog(catalog);
        if (applied) {
          DatApp.refreshViews();
          DatApp.updateCloudStatus('Cloud catalog loaded.', 'ok');
        }
        return applied;
      } catch (error) {
        if (!settings.silent) DatApp.updateCloudStatus('Cloud sync unavailable. Using browser data.', 'warn');
        return false;
      }
    },
    async saveCloudCatalog() {
      if (!DatApp.canUseCloudApi()) {
        DatApp.updateCloudStatus('Cloud save needs the deployed site or a local server.', 'warn');
        return false;
      }

      const token = DatApp.getAdminToken();
      if (!token) {
        DatApp.updateCloudStatus('Enter and save the Cloud admin token first.', 'warn');
        return false;
      }

      try {
        DatApp.updateCloudStatus('Saving cloud catalog...', 'busy');
        const response = await fetch(CLOUD_CATALOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(DatApp.catalogPayload()),
        });

        if (response.status === 401) {
          DatApp.updateCloudStatus('Cloud token is incorrect.', 'warn');
          return false;
        }

        if (!response.ok) throw new Error('Cloud save failed');

        const catalog = await response.json();
        DatApp.applyCatalog(catalog);
        DatApp.refreshViews();
        DatApp.state.isDirty = false;
        DatApp.hideSaveBanner();
        DatApp.updateCloudStatus('Saved to Cloud. Customer page is updated.', 'ok');
        return true;
      } catch (error) {
        DatApp.updateCloudStatus('Cloud save failed. Check your Pages binding/token.', 'warn');
        return false;
      }
    },
  };

  window.DatApp = DatApp;
})();
