/* ---------------------------------------------------------------------------
   Kuwaiti Oil Tankers — page behaviour.

   Loads data/fleet.json once and draws from it: four stat tiles, three charts
   and the sortable register. No dependencies, no build step.

   Colour rule: every class of ship is assigned a series slot once, in a fixed
   order, and keeps it. Filtering the table never repaints a chart, so a reader
   who has learned that VLCCs are blue is never misled.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';

  var REFERENCE_YEAR = 2026;   // matches the age arithmetic in schema.sql

  // Fixed slot order. A class added later takes the next free slot; past five
  // it would fold into "Other" rather than generate a sixth hue.
  var CLASS_ORDER = ['VLCC', 'Aframax', 'MR Product Tanker', 'VLGC', 'LPG Carrier'];
  var SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)',
                'var(--series-4)', 'var(--series-5)'];

  function classColour(type) {
    var i = CLASS_ORDER.indexOf(type);
    return i === -1 ? 'var(--text-muted)' : SERIES[i];
  }

  // Bars fill at most this share of their lane, leaving room for the tip label.
  var BAR_SCALE = 76;
  // Same idea vertically: the tallest column stops short so its cap label fits.
  var COL_SCALE = 88;

  var el = function (id) { return document.getElementById(id); };
  var nf = new Intl.NumberFormat('en-GB');
  function num(v) { return v === null || v === undefined ? '—' : nf.format(v); }

  function compact(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'bn';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    if (n >= 1e3) return Math.round(n / 1e3) + 'k';
    return String(n);
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  /* ---------------- tooltip ---------------- */

  var tip = el('tip');

  function showTip(event, title, detail) {
    tip.replaceChildren(make('strong', null, title), make('span', null, detail));
    tip.hidden = false;
    moveTip(event);
  }

  function moveTip(event) {
    if (tip.hidden) return;
    var pad = 14;
    var box = tip.getBoundingClientRect();
    var x = event.clientX + pad;
    var y = event.clientY + pad;
    if (x + box.width > window.innerWidth - 8) x = event.clientX - box.width - pad;
    if (y + box.height > window.innerHeight - 8) y = event.clientY - box.height - pad;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
  }

  function hideTip() { tip.hidden = true; }

  // Hover is the default layer on every mark; the hit target is the whole row
  // or column, not the few pixels of the fill itself.
  function hoverable(node, title, detail) {
    node.addEventListener('pointerenter', function (e) { showTip(e, title, detail); });
    node.addEventListener('pointermove', moveTip);
    node.addEventListener('pointerleave', hideTip);
    node.tabIndex = 0;
    node.addEventListener('focus', function () {
      var box = node.getBoundingClientRect();
      showTip({ clientX: box.left + box.width / 2, clientY: box.bottom }, title, detail);
    });
    node.addEventListener('blur', hideTip);
  }

  /* ---------------- charts ---------------- */

  /* One series, one colour. The category is on the axis, so hue is free to stay
     constant rather than double-encode bar length. */
  function horizontalBars(mount, rows, options) {
    options = options || {};
    var max = rows.reduce(function (m, r) { return Math.max(m, r.value); }, 0) || 1;
    mount.replaceChildren();

    rows.forEach(function (row) {
      var line = make('div', 'bar-row');

      var name = make('div', 'bar-name');
      name.append(document.createTextNode(row.label));
      if (row.sublabel) name.append(make('small', null, row.sublabel));

      var lane = make('div', 'bar-lane');
      var fill = make('div', 'bar-fill');
      fill.style.width = Math.max(0.6, (row.value / max) * BAR_SCALE) + '%';
      if (options.colourBy) fill.style.background = classColour(row.label);
      lane.append(fill, make('span', 'bar-value', row.display || num(row.value)));

      line.append(name, lane);
      hoverable(line, row.label, row.tip || (row.display || num(row.value)));
      mount.append(line);
    });
  }

  /* Stacked columns. Segments are separated by a 2px gap in the surface colour,
     never a stroke, and only the top segment is rounded. */
  function stackedColumns(mount, buckets, keys) {
    var max = buckets.reduce(function (m, b) { return Math.max(m, b.total); }, 0) || 1;
    mount.replaceChildren();

    buckets.forEach(function (bucket) {
      var col = make('div', 'col');
      var stack = make('div', 'col-stack');
      // Label the extreme only; every other total is in the tooltip and the
      // register table below.
      if (bucket.total === max) stack.append(make('div', 'col-cap', bucket.total));
      // Draw top-down so the first child is the cap that gets the rounded end.
      keys.slice().reverse().forEach(function (key) {
        var value = bucket.parts[key];
        if (!value) return;
        var seg = make('div', 'seg');
        seg.style.height = (value / max) * COL_SCALE + '%';
        seg.style.background = classColour(key);
        stack.append(seg);
      });

      col.append(stack, make('div', 'col-label', bucket.label));

      var detail = keys
        .filter(function (k) { return bucket.parts[k]; })
        .map(function (k) { return bucket.parts[k] + ' × ' + k; })
        .join('  ·  ');
      hoverable(col, bucket.label, detail);
      mount.append(col);
    });
  }

  function legend(mount, keys) {
    mount.replaceChildren();
    keys.forEach(function (key) {
      var item = make('span', 'legend-item');
      var swatch = make('span', 'legend-swatch');
      swatch.style.background = classColour(key);
      item.append(swatch, document.createTextNode(key));
      mount.append(item);
    });
  }

  /* ---------------- register ---------------- */

  function buildRegister(vessels) {
    var tbody = document.querySelector('#register tbody');
    var search = el('f-search');
    var typeSel = el('f-type');
    var cargoSel = el('f-cargo');
    var flagged = el('f-flagged');
    var count = el('f-count');
    var sort = { key: 'built_year', dir: -1 };

    function options(select, values) {
      values.forEach(function (v) {
        var option = make('option', null, v);
        option.value = v;
        select.append(option);
      });
    }
    options(typeSel, CLASS_ORDER.filter(function (c) {
      return vessels.some(function (v) { return v.vessel_type === c; });
    }));
    options(cargoSel, Array.from(new Set(vessels.map(function (v) { return v.cargo_class; }))).sort());

    function hasCaveat(v) {
      return v.status !== 'in_service' || v.dwt_basis === 'sister_vessel_class';
    }

    function matches(v) {
      if (typeSel.value && v.vessel_type !== typeSel.value) return false;
      if (cargoSel.value && v.cargo_class !== cargoSel.value) return false;
      if (flagged.checked && !hasCaveat(v)) return false;
      var q = search.value.trim().toLowerCase();
      if (!q) return true;
      return [v.name, v.name_ar, v.imo, v.mmsi, v.builder, v.flag, v.vessel_type, v.call_sign]
        .some(function (field) {
          return field !== null && field !== undefined &&
                 String(field).toLowerCase().indexOf(q) !== -1;
        });
    }

    function compare(a, b) {
      var x = a[sort.key], y = b[sort.key];
      // Missing values sort last whichever way the column is pointing.
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir;
      return String(x).localeCompare(String(y)) * sort.dir;
    }

    function cell(text, className) {
      var td = make('td', className || null);
      td.textContent = text;
      return td;
    }

    function render() {
      var rows = vessels.filter(matches).sort(compare);
      tbody.replaceChildren();

      rows.forEach(function (v) {
        var tr = document.createElement('tr');

        var name = make('td', 'cell-name');
        var dot = make('span', 'dot');
        dot.style.background = classColour(v.vessel_type);
        name.append(dot, document.createTextNode(v.name));
        if (v.name_ar) {
          var ar = make('span', 'ar', v.name_ar);
          ar.lang = 'ar';
          ar.dir = 'rtl';
          name.append(ar);
        }
        if (v.status !== 'in_service') {
          var mark = make('abbr', 'caveat', '⚑');
          mark.title = v.notes || 'Flag or ownership unverified.';
          name.append(mark);
        }

        var dwt = make('td', 'num cell-mono');
        if (v.dwt === null) {
          dwt.textContent = '—';
        } else {
          dwt.textContent = num(v.dwt);
          if (v.dwt_basis === 'sister_vessel_class') {
            var approx = make('abbr', 'caveat', '≈');
            approx.title = 'Carried across from a confirmed sister ship, not published for this hull.';
            dwt.append(' ', approx);
          }
        }

        tr.append(
          name,
          cell(v.vessel_type),
          cell(v.imo, 'num cell-mono'),
          dwt,
          cell(v.built_year, 'num cell-mono'),
          cell(v.builder || '—', v.builder ? null : 'approx'),
          cell(v.flag || 'unverified', v.flag ? null : 'approx')
        );
        tbody.append(tr);
      });

      count.textContent = rows.length + ' of ' + vessels.length + ' vessels';
    }

    document.querySelectorAll('thead button').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.dataset.sort;
        if (sort.key === key) {
          sort.dir *= -1;
        } else {
          sort.key = key;
          // Numbers read best largest-first; names read best A–Z.
          sort.dir = ['dwt', 'built_year', 'imo'].indexOf(key) === -1 ? 1 : -1;
        }
        document.querySelectorAll('thead button').forEach(function (other) {
          other.removeAttribute('aria-sort');
        });
        button.setAttribute('aria-sort', sort.dir === 1 ? 'ascending' : 'descending');
        render();
      });
    });

    [search, typeSel, cargoSel, flagged].forEach(function (control) {
      control.addEventListener('input', render);
    });

    render();
  }

  /* ---------------- assembly ---------------- */

  function draw(data) {
    var vessels = data.vessels;

    var totalDwt = vessels.reduce(function (sum, v) { return sum + (v.dwt || 0); }, 0);
    var avgAge = vessels.reduce(function (sum, v) {
      return sum + (REFERENCE_YEAR - v.built_year);
    }, 0) / vessels.length;

    el('stat-hulls').textContent = vessels.length;
    el('stat-dwt').textContent = compact(totalDwt);
    el('stat-age').textContent = avgAge.toFixed(1);
    el('stat-yards').textContent = data.builders.length;

    // Capacity by class.
    var byClass = CLASS_ORDER.map(function (type) {
      var group = vessels.filter(function (v) { return v.vessel_type === type; });
      var dwt = group.reduce(function (sum, v) { return sum + (v.dwt || 0); }, 0);
      return {
        label: type,
        value: dwt,
        sublabel: group.length + (group.length === 1 ? ' hull' : ' hulls'),
        display: num(dwt) + ' t',
        tip: group.length + ' hulls · ' + num(dwt) + ' tonnes deadweight'
      };
    }).filter(function (row) { return row.value > 0; });
    horizontalBars(el('chart-type'), byClass, { colourBy: true });

    // Deliveries by year and class.
    var years = Array.from(new Set(vessels.map(function (v) { return v.built_year; }))).sort();
    var buckets = years.map(function (year) {
      var group = vessels.filter(function (v) { return v.built_year === year; });
      var parts = {};
      CLASS_ORDER.forEach(function (type) {
        parts[type] = group.filter(function (v) { return v.vessel_type === type; }).length;
      });
      return { label: year, total: group.length, parts: parts };
    });
    legend(el('legend-year'), CLASS_ORDER);
    stackedColumns(el('chart-year'), buckets, CLASS_ORDER);

    // Where the cargo goes — synthetic.
    var lanes = data.voyage_summary.by_region.map(function (row) {
      return {
        label: row.region,
        value: row.tonnes,
        sublabel: row.voyages + ' voyages',
        display: compact(row.tonnes) + ' t',
        tip: num(row.tonnes) + ' tonnes over ' + row.voyages + ' generated voyages'
      };
    });
    horizontalBars(el('chart-lanes'), lanes);

    // Shipyards.
    var yards = data.builders.map(function (builder) {
      var group = vessels.filter(function (v) { return v.builder_id === builder.builder_id; });
      return {
        label: builder.name,
        value: group.length,
        sublabel: builder.country,
        display: group.length + (group.length === 1 ? ' hull' : ' hulls'),
        tip: group.map(function (v) { return v.name; }).join(', ')
      };
    }).sort(function (a, b) { return b.value - a.value; });
    horizontalBars(el('chart-yards'), yards);

    buildRegister(vessels);

    var unknown = vessels.filter(function (v) { return !v.builder; }).length;
    el('register-note').textContent =
      '⚑ marks a hull whose AIS registration disagrees with its recorded flag. ' +
      '≈ marks a deadweight carried across from a confirmed sister ship rather than ' +
      'published for that hull. ' + unknown + ' rows have no confirmed builder. ' +
      'Hover either mark for the detail.';

    el('status').hidden = true;
    el('app').hidden = false;
  }

  fetch('data/fleet.json')
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(draw)
    .catch(function (error) {
      var status = el('status');
      status.className = 'status error';
      status.replaceChildren(
        make('p', null, 'Could not load data/fleet.json — ' + error.message + '.'),
        make('p', null,
          'This page reads the dataset over fetch, so it needs to be served rather ' +
          'than opened from the filesystem. From the repository root: ' +
          'python3 -m http.server 8000, then open http://localhost:8000/tankers/.')
      );
    });
})();
