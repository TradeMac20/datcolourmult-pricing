// =================== SERVICES AND PRICE LIST ===================
(function (app) {
  function serviceById(cat, id) {
    return (app.state.services[cat] || []).find(service => service.id === id);
  }

  function setText(parent, selector, value) {
    const target = parent.querySelector(selector);
    if (target) target.textContent = value || '';
  }

  app.showCat = function showCat(cat) {
    document.querySelectorAll('.cat-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.cat === cat);
    });
    document.querySelectorAll('.services-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === 'panel-' + cat);
    });
  };

  app.renderServiceCards = function renderServiceCards() {
    app.CATEGORY_ORDER.forEach(cat => {
      const panel = document.getElementById('panel-' + cat);
      if (!panel) return;
      panel.innerHTML = '';

      app.state.services[cat].forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.theme = cat;

        const title = document.createElement('h3');
        title.textContent = service.name;

        const description = document.createElement('p');
        description.textContent = service.desc || '';

        card.append(title, description);

        if (service.price) {
          const price = document.createElement('p');
          price.className = 'service-card-price';
          price.textContent = 'GHS ' + Number(service.price).toFixed(2) + ' ';

          const unit = document.createElement('span');
          unit.textContent = service.unit || '';
          price.appendChild(unit);
          card.appendChild(price);
        }

        panel.appendChild(card);
      });
    });

    app.renderCustomerServices();
  };

  app.escapeHTML = function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  app.formatCustomerServiceName = function formatCustomerServiceName(name) {
    const escaped = app.escapeHTML(name);
    const lineBreaks = {
      'Coloured/Black &amp; White printing': 'Coloured/Black<br>&amp; White printing',
      'Key Holders/ Mugs/ Pen/Face Towel': 'Key Holders/ Mugs/<br>Pen/Face Towel',
      'Indoor and Outdoor Branding': 'Indoor and Outdoor<br>Branding',
    };
    return lineBreaks[escaped] || escaped;
  };

  app.renderCustomerServices = function renderCustomerServices() {
    app.CATEGORY_ORDER.forEach(cat => {
      const list = document.querySelector(`[data-customer-panel="${cat}"]`);
      if (!list) return;
      list.innerHTML = '';

      (app.state.services[cat] || []).forEach(service => {
        const item = document.createElement('li');
        item.innerHTML = app.formatCustomerServiceName(service.name);
        list.appendChild(item);
      });
    });
  };

  app.renderPrices = function renderPrices() {
    const container = document.getElementById('price-sections');
    if (!container) return;
    container.innerHTML = '';

    app.CATEGORY_ORDER.forEach(cat => {
      const meta = app.CAT_META[cat];
      const section = document.createElement('div');
      section.className = 'price-section';

      const header = document.createElement('div');
      header.className = 'price-section-header';
      const heading = document.createElement('h3');
      const badge = document.createElement('span');
      badge.className = 'price-badge ' + meta.badge;
      badge.textContent = meta.label;
      heading.appendChild(badge);
      header.appendChild(heading);

      const table = document.createElement('table');
      table.className = 'price-table';
      table.innerHTML = `
        <thead><tr>
          <th class="price-service-col">Service</th>
          <th>Description</th>
          <th class="price-amount-col">Price (GHS)</th>
          <th class="price-unit-col">Unit</th>
          <th class="price-action-col"></th>
        </tr></thead>
        <tbody id="tbody-${cat}"></tbody>
      `;

      const addButton = document.createElement('button');
      addButton.className = 'add-row-btn';
      addButton.type = 'button';
      addButton.dataset.action = 'add-price-row';
      addButton.dataset.cat = cat;
      addButton.textContent = '+ Add row';

      section.append(header, table, addButton);
      container.appendChild(section);
      app.state.services[cat].forEach(service => app.appendPriceRow(cat, service));
    });
  };

  app.appendPriceRow = function appendPriceRow(cat, service) {
    const tbody = document.getElementById('tbody-' + cat);
    if (!tbody) return;

    const row = document.createElement('tr');
    row.dataset.id = service.id;

    const fields = [
      { field: 'name', className: 'svc-name-input', value: service.name, placeholder: '' },
      { field: 'desc', className: 'svc-name-input', value: service.desc || '', placeholder: 'Description...' },
      { field: 'price', className: 'price-input', value: service.price, placeholder: '', type: 'number', step: '0.01' },
      { field: 'unit', className: 'unit-input', value: service.unit || '', placeholder: 'e.g. per page' },
    ];

    fields.forEach(config => {
      const cell = document.createElement('td');
      const input = document.createElement('input');
      input.className = config.className;
      input.value = config.value;
      input.dataset.action = 'update-service';
      input.dataset.cat = cat;
      input.dataset.id = service.id;
      input.dataset.field = config.field;
      if (config.placeholder) input.placeholder = config.placeholder;
      if (config.type) input.type = config.type;
      if (config.step) input.step = config.step;
      cell.appendChild(input);
      row.appendChild(cell);
    });

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-danger';
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete-service';
    deleteButton.dataset.cat = cat;
    deleteButton.dataset.id = service.id;
    deleteButton.textContent = '✕';
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  };

  app.updateSvc = function updateSvc(cat, id, field, value) {
    const service = serviceById(cat, id);
    if (!service) return;

    service[field] = field === 'price' ? parseFloat(value) || 0 : value;
    app.persistServices();
    app.renderCustomerServices();
    app.renderServiceCards();
    app.renderCalc();
    app.markDirty();
  };

  app.deleteRow = function deleteRow(cat, id) {
    app.state.services[cat] = app.state.services[cat].filter(service => service.id !== id);
    app.persistServices();
    app.renderPrices();
    app.renderServiceCards();
    app.renderCalc();
    app.markDirty();
  };

  app.addRowInline = function addRowInline(cat) {
    const id = cat[0] + Date.now();
    const service = { id, name: 'New Service', price: 0, unit: 'per piece', desc: '' };
    app.state.services[cat].push(service);
    app.persistServices();
    app.appendPriceRow(cat, service);
    app.renderCustomerServices();
    app.renderServiceCards();
    app.renderCalc();
    app.markDirty();
  };

  app.markDirty = function markDirty() {
    app.state.isDirty = true;
    const banner = document.getElementById('save-banner');
    if (banner) banner.classList.add('show');
  };

  app.hideSaveBanner = function hideSaveBanner() {
    const banner = document.getElementById('save-banner');
    if (banner) banner.classList.remove('show');
  };

  app.savePrices = function savePrices() {
    app.renderServiceCards();
    app.renderCalc();
    app.saveCloudCatalog();
  };

  app.addServiceModal = function addServiceModal() {
    const modal = document.getElementById('modal-add');
    if (modal) modal.classList.add('open');
  };

  app.closeModal = function closeModal() {
    const modal = document.getElementById('modal-add');
    if (modal) modal.classList.remove('open');
  };

  app.confirmAddService = function confirmAddService() {
    const cat = document.getElementById('modal-cat').value;
    const name = document.getElementById('modal-name').value.trim();
    const price = parseFloat(document.getElementById('modal-price').value) || 0;
    const unit = document.getElementById('modal-unit').value.trim();
    const desc = document.getElementById('modal-desc').value.trim();

    if (!name) {
      window.alert('Please enter a service name.');
      return;
    }

    const id = cat[0] + Date.now();
    app.state.services[cat].push({ id, name, price, unit, desc });
    app.persistServices();
    app.closeModal();
    app.renderPrices();
    app.renderServiceCards();
    app.renderCalc();
    app.markDirty();
    ['modal-name', 'modal-price', 'modal-unit', 'modal-desc'].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
  };

  app.refreshPriceRow = function refreshPriceRow(input) {
    app.updateSvc(input.dataset.cat, input.dataset.id, input.dataset.field, input.value);
  };

  app.syncRenderedServiceText = function syncRenderedServiceText(row, service) {
    setText(row, '[data-output="service-name"]', service.name);
    setText(row, '[data-output="service-desc"]', service.desc);
  };
})(window.DatApp);
