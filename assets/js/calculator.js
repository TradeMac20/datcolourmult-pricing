// =================== CALCULATOR AND PRESETS ===================
(function (app) {
  app.getAllServices = function getAllServices() {
    const all = [];
    app.CATEGORY_ORDER.forEach(cat => {
      app.state.services[cat].forEach(service => all.push({ ...service, cat }));
    });
    return all;
  };

  app.renderCalc = function renderCalc() {
    const container = document.getElementById('calc-groups');
    if (!container) return;
    container.innerHTML = '';

    app.CATEGORY_ORDER.forEach(cat => {
      if (!app.state.services[cat].length) return;

      const meta = app.CAT_META[cat];
      const group = document.createElement('div');
      group.className = 'calc-group';

      const title = document.createElement('div');
      title.className = 'calc-group-title';

      const dot = document.createElement('span');
      dot.className = 'calc-group-dot dot-' + cat;
      title.append(dot, document.createTextNode(meta.label));

      const rows = document.createElement('div');
      rows.className = 'calc-rows';
      rows.id = 'calc-rows-' + cat;

      group.append(title, rows);
      container.appendChild(group);

      app.state.services[cat].forEach(service => {
        const row = document.createElement('div');
        row.className = 'calc-row';
        const qty = app.state.calcQty[service.id] || 0;

        const label = document.createElement('label');
        label.title = service.desc || '';
        label.textContent = service.name;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = qty;
        input.id = 'qty-' + service.id;
        input.placeholder = 'Qty';
        input.dataset.action = 'update-calc';
        input.dataset.id = service.id;

        const unit = document.createElement('span');
        unit.className = 'unit-label';
        unit.textContent = service.unit || '';

        const lineTotal = document.createElement('span');
        lineTotal.className = 'line-total';
        lineTotal.id = 'lt-' + service.id;
        lineTotal.textContent = qty > 0 ? 'GHS ' + (qty * service.price).toFixed(2) : '—';

        row.append(label, input, unit, lineTotal);
        rows.appendChild(row);
      });
    });

    app.renderPresets();
    app.updateTotal();
  };

  app.updateCalc = function updateCalc(id, value) {
    const qty = parseFloat(value) || 0;
    app.state.calcQty[id] = qty;
    const service = app.getAllServices().find(item => item.id === id);
    const lineTotal = document.getElementById('lt-' + id);

    if (lineTotal && service) {
      lineTotal.textContent = qty > 0 ? 'GHS ' + (qty * service.price).toFixed(2) : '—';
    }

    app.updateTotal();
  };

  app.updateTotal = function updateTotal() {
    const total = app.getAllServices().reduce((sum, service) => {
      return sum + ((app.state.calcQty[service.id] || 0) * service.price);
    }, 0);
    const totalEl = document.getElementById('calc-total');
    if (totalEl) totalEl.textContent = total.toFixed(2);
  };

  app.renderPresets = function renderPresets() {
    const list = document.getElementById('preset-list');
    if (!list) return;
    list.innerHTML = '';

    app.state.presets.forEach((preset, index) => {
      const item = document.createElement('div');
      item.className = 'preset-item' + (app.state.activePreset === index ? ' active' : '');

      const name = document.createElement('button');
      name.className = 'preset-name-btn';
      name.type = 'button';
      name.dataset.action = 'load-preset';
      name.dataset.index = String(index);
      name.textContent = preset.name;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'preset-del';
      deleteButton.type = 'button';
      deleteButton.dataset.action = 'delete-preset';
      deleteButton.dataset.index = String(index);
      deleteButton.textContent = '✕';

      item.append(name, deleteButton);
      list.appendChild(item);
    });
  };

  app.loadPreset = function loadPreset(index) {
    app.state.activePreset = index;
    app.state.calcQty = { ...app.state.presets[index].items };
    app.renderCalc();

    document.querySelectorAll('.preset-item').forEach((item, itemIndex) => {
      item.classList.toggle('active', itemIndex === index);
    });

    Object.keys(app.state.calcQty).forEach(id => {
      const input = document.getElementById('qty-' + id);
      if (input) input.value = app.state.calcQty[id] || 0;
      const service = app.getAllServices().find(item => item.id === id);
      if (service) {
        const lineTotal = document.getElementById('lt-' + id);
        if (lineTotal) {
          lineTotal.textContent = app.state.calcQty[id] > 0
            ? 'GHS ' + (app.state.calcQty[id] * service.price).toFixed(2)
            : '—';
        }
      }
    });

    app.updateTotal();
  };

  app.savePreset = function savePreset() {
    const input = document.getElementById('new-preset-name');
    const name = input.value.trim();
    if (!name) {
      app.showToast('Enter a preset name first');
      return;
    }

    const items = { ...app.state.calcQty };
    Object.keys(items).forEach(key => {
      if (!items[key]) delete items[key];
    });

    app.state.presets.push({ name, items });
    app.persistPresets();
    input.value = '';
    app.renderPresets();
    app.showToast('✓ Preset "' + name + '" queued for cloud save.');
  };

  app.deletePreset = function deletePreset(index) {
    app.state.presets.splice(index, 1);
    if (app.state.activePreset === index) {
      app.state.activePreset = null;
    } else if (app.state.activePreset > index) {
      app.state.activePreset--;
    }
    app.persistPresets();
    app.renderPresets();
  };
})(window.DatApp);
