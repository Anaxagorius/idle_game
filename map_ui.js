/* ==========================================================================
   Idle Empire Ultimate - map_ui.js
   Nova Scotia map rendering (SVG), county selector modal, building pin logic.
   ========================================================================== */

(function () {
  var MapData = Game.Map;
  var MapUI = {};

  var SVG_W = 780;
  var SVG_H = 400;
  var PDF_VIEW_PARAMS = '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
  var ALLOWED_UPLOADED_MAP_FILES = { 'Nova_Scotia.pdf': true };
  var UPLOADED_MAP_FILE = 'Nova_Scotia.pdf';
  var UPLOADED_MAP_PDF = buildUploadedMapPdfPath(UPLOADED_MAP_FILE);

  function buildUploadedMapPdfPath(fileName) {
    if (!fileName || !ALLOWED_UPLOADED_MAP_FILES[fileName]) return null;
    return encodeURIComponent(fileName) + PDF_VIEW_PARAMS;
  }

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    var keys = Object.keys(attrs || {});
    for (var i = 0; i < keys.length; i++) {
      el.setAttribute(keys[i], attrs[keys[i]]);
    }
    return el;
  }

  function svgDefs() {
    var defs = svgEl('defs', {});

    // Glow filter for selected/empire county
    var filter = svgEl('filter', { id: 'county-glow', x: '-20%', y: '-20%', width: '140%', height: '140%' });
    var blur = svgEl('feGaussianBlur', { stdDeviation: '3', result: 'coloredBlur' });
    var merge = svgEl('feMerge', {});
    var mn1 = svgEl('feMergeNode', { in: 'coloredBlur' });
    var mn2 = svgEl('feMergeNode', { in: 'SourceGraphic' });
    merge.appendChild(mn1);
    merge.appendChild(mn2);
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);

    return defs;
  }

  /* ── build the SVG map ─────────────────────────────────────────────────── */
  /*
   * mode:
   *   'full'     — full-size map tab (resource zones + pins + labels)
   *   'mini'     — small Economy-tab widget (borders + empire highlight + pins)
   *   'selector' — county-selection modal (clickable counties + labels)
   */
  MapUI.buildSVG = function (container, mode) {
    var selectedCounty = Game.state.map ? Game.state.map.selectedCounty : null;
    var isMini = mode === 'mini';
    var isSelector = mode === 'selector';
    var isFull = mode === 'full';
    var useUploadedBackdrop = isFull;

    var svgId = isMini ? 'mini-map-svg' : isSelector ? 'selector-map-svg' : 'full-map-svg';

    var svg = svgEl('svg', {
      viewBox: '0 0 ' + SVG_W + ' ' + SVG_H,
      width: '100%',
      class: 'ns-map ns-map--' + mode,
      id: svgId,
      role: 'img',
      'aria-label': 'Nova Scotia county map',
    });

    svg.appendChild(svgDefs());

    // Ocean background
    svg.appendChild(svgEl('rect', {
      x: 0, y: 0, width: SVG_W, height: SVG_H,
      fill: '#1a4a6e', rx: 8,
      opacity: useUploadedBackdrop ? 0.35 : 1,
    }));

    // Canso Causeway (thin dashed bridge between mainland and Cape Breton)
    svg.appendChild(svgEl('line', {
      x1: 548, y1: 155, x2: 558, y2: 182,
      stroke: '#ccc', 'stroke-width': 3, 'stroke-dasharray': '4,3',
      opacity: 0.8,
    }));

    // Province title (full / selector)
    if (!isMini) {
      var title = svgEl('text', {
        x: SVG_W / 2, y: 18,
        'text-anchor': 'middle',
        fill: '#e6ecff',
        'font-size': 13,
        'font-weight': '700',
        'font-family': 'Segoe UI, sans-serif',
        opacity: 0.7,
        'pointer-events': 'none',
      });
      title.textContent = 'Nova Scotia, Canada';
      svg.appendChild(title);
    }

    // Counties
    for (var ci = 0; ci < MapData.COUNTIES.length; ci++) {
      var county = MapData.COUNTIES[ci];
      var isEmpire = county.id === selectedCounty;

      var strokeColor = '#fff';
      var strokeWidth = isMini ? 0.8 : 1.5;
      var countyOpacity = useUploadedBackdrop ? 0.45 : 0.9;
      var extraFilter = '';

      if (isEmpire) {
        strokeColor = '#ffd700';
        strokeWidth = isMini ? 2 : 3;
        countyOpacity = useUploadedBackdrop ? 0.82 : 1;
        if (!isMini) extraFilter = 'url(#county-glow)';
      } else if (selectedCounty && !isSelector) {
        countyOpacity = useUploadedBackdrop ? 0.25 : 0.55;
      }

      var polyAttrs = {
        points: county.points,
        fill: county.color,
        stroke: strokeColor,
        'stroke-width': strokeWidth,
        opacity: countyOpacity,
        class: 'county-poly',
        'data-county': county.id,
      };
      if (extraFilter) polyAttrs.filter = extraFilter;

      var poly = svgEl('polygon', polyAttrs);
      svg.appendChild(poly);

      // County name label (not on mini-map)
      if (!isMini) {
        var lbl = svgEl('text', {
          x: county.center[0],
          y: county.center[1],
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          fill: county.textColor || '#fff',
          'font-size': isSelector ? 8 : 9,
          'font-weight': '600',
          'font-family': 'Segoe UI, sans-serif',
          'pointer-events': 'none',
          class: 'county-label',
        });
        lbl.textContent = county.name;
        svg.appendChild(lbl);

        // Empire crown badge
        if (isEmpire && isFull) {
          var crown = svgEl('text', {
            x: county.center[0],
            y: county.center[1] - 12,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': 11,
            'pointer-events': 'none',
          });
          crown.textContent = '👑';
          svg.appendChild(crown);
        }
      }
    }

    // Resource zone markers (full map only)
    if (isFull) {
      for (var ri = 0; ri < MapData.COUNTIES.length; ri++) {
        var rc = MapData.COUNTIES[ri];
        if (!rc.resources) continue;
        for (var zi = 0; zi < rc.resources.length; zi++) {
          var zone = rc.resources[zi];
          var info = MapData.TERRAIN_INFO[zone.type];
          var zg = svgEl('g', { class: 'resource-zone', 'data-type': zone.type });
          zg.appendChild(svgEl('circle', {
            cx: zone.x, cy: zone.y, r: 7,
            fill: info.markerColor,
            stroke: info.markerBorder,
            'stroke-width': 1,
            opacity: 0.88,
          }));
          var zicon = svgEl('text', {
            x: zone.x, y: zone.y + 1,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': 7,
            'pointer-events': 'none',
          });
          zicon.textContent = info.icon;
          zg.appendChild(zicon);

          var ztip = svgEl('title', {});
          ztip.textContent = rc.name + ': ' + info.label;
          zg.appendChild(ztip);
          svg.appendChild(zg);
        }
      }
    }

    // Building pins
    if (isFull || isMini) {
      MapUI._renderPins(svg, mode);
    }

    // Compass rose (full only)
    if (isFull) {
      var compass = svgEl('text', {
        x: SVG_W - 16, y: SVG_H - 10,
        'text-anchor': 'end',
        fill: '#e6ecff',
        'font-size': 11,
        opacity: 0.5,
        'pointer-events': 'none',
      });
      compass.textContent = '↑ N';
      svg.appendChild(compass);
    }

    container.innerHTML = '';
    if (useUploadedBackdrop) {
      var frame = document.createElement('div');
      frame.className = 'map-svg-frame';

      var backdrop = document.createElement('div');
      backdrop.className = 'uploaded-map-backdrop';

      if (UPLOADED_MAP_PDF) {
        var pdf = document.createElement('object');
        pdf.className = 'uploaded-map-pdf';
        pdf.type = 'application/pdf';
        pdf.setAttribute('aria-hidden', 'true');
        pdf.addEventListener('error', function () {
          backdrop.classList.add('uploaded-map-backdrop--unavailable');
        });
        pdf.data = UPLOADED_MAP_PDF;
        backdrop.appendChild(pdf);
      } else {
        backdrop.classList.add('uploaded-map-backdrop--unavailable');
      }

      var fallback = document.createElement('div');
      fallback.className = 'uploaded-map-fallback';
      fallback.textContent = 'Uploaded Nova Scotia map preview unavailable.';
      backdrop.appendChild(fallback);

      var legendMask = document.createElement('div');
      legendMask.className = 'uploaded-map-legend-mask';
      backdrop.appendChild(legendMask);

      frame.appendChild(backdrop);
      frame.appendChild(svg);
      container.appendChild(frame);
    } else {
      container.appendChild(svg);
    }

    // Interaction for selector mode
    if (isSelector) {
      var polys = svg.querySelectorAll('.county-poly');
      var polysArr = Array.prototype.slice.call(polys);
      polysArr.forEach(function (poly) {
        poly.style.cursor = 'pointer';
        poly.addEventListener('mouseenter', function () {
          var cid = this.getAttribute('data-county');
          if (cid !== (Game.state.map && Game.state.map._pendingCounty)) {
            this.setAttribute('opacity', '1');
            this.setAttribute('stroke', '#ffd700');
            this.setAttribute('stroke-width', '2.5');
            MapUI._showSelectorInfo(cid);
          }
        });
        poly.addEventListener('mouseleave', function () {
          var cid = this.getAttribute('data-county');
          if (cid !== (Game.state.map && Game.state.map._pendingCounty)) {
            this.setAttribute('opacity', '0.85');
            this.setAttribute('stroke', '#fff');
            this.setAttribute('stroke-width', '1.5');
          }
        });
        poly.addEventListener('click', function () {
          MapUI._selectorPickCounty(this.getAttribute('data-county'));
        });
      });
    }

    return svg;
  };

  /* ── pin rendering ─────────────────────────────────────────────────────── */
  MapUI._renderPins = function (svg, mode) {
    var s = Game.state;
    if (!s.map || !s.map.pins || s.map.pins.length === 0) return;
    var isMini = mode === 'mini';

    for (var i = 0; i < s.map.pins.length; i++) {
      var pin = s.map.pins[i];
      var building = Game.config.buildingMap[pin.buildingId];
      if (!building) continue;

      var r = isMini ? 3 : 7;
      var pg = svgEl('g', { class: 'map-pin' });

      // Outer glow ring
      pg.appendChild(svgEl('circle', {
        cx: pin.x, cy: pin.y, r: r + (isMini ? 1 : 2),
        fill: 'none', stroke: '#ffd700', 'stroke-width': isMini ? 0.8 : 1.2, opacity: 0.5,
      }));
      // Main dot
      pg.appendChild(svgEl('circle', {
        cx: pin.x, cy: pin.y, r: r,
        fill: '#ffd700', stroke: '#333', 'stroke-width': isMini ? 0.5 : 1,
      }));

      if (!isMini) {
        // Building icon letter
        var ltr = svgEl('text', {
          x: pin.x, y: pin.y + 1,
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-size': 6,
          'font-weight': '700',
          fill: '#1a1a2e',
          'pointer-events': 'none',
        });
        ltr.textContent = building.name.charAt(0);
        pg.appendChild(ltr);

        // Tooltip
        var tip = svgEl('title', {});
        tip.textContent = building.name;
        pg.appendChild(tip);
      }

      svg.appendChild(pg);
    }
  };

  /* ── selector modal helpers ────────────────────────────────────────────── */
  MapUI._showSelectorInfo = function (countyId) {
    var county = MapData.COUNTY_MAP[countyId];
    var panel = document.getElementById('county-selector-info');
    if (!county || !panel) return;

    // Build unique resource labels
    var seen = {};
    var res = (county.resources || []).map(function (r) {
      if (seen[r.type]) return null;
      seen[r.type] = true;
      var t = MapData.TERRAIN_INFO[r.type];
      return '<span class="terrain-badge terrain-' + r.type + '">' + t.icon + ' ' + t.label + '</span>';
    }).filter(Boolean).join(' ');

    panel.innerHTML =
      '<h3 style="color:' + county.color + ';margin:0 0 6px">' + county.name + ' County</h3>' +
      '<p class="muted" style="margin:0 0 8px;font-size:13px">' + county.description + '</p>' +
      '<div style="margin-bottom:10px">' + res + '</div>' +
      '<button class="settings-btn selector-confirm-btn" ' +
        'onclick="Game.MapUI.confirmCountySelection(\'' + county.id + '\')">' +
        '🏴 Claim ' + county.name + ' as Your Empire' +
      '</button>';
    panel.style.display = 'block';
  };

  MapUI._selectorPickCounty = function (countyId) {
    var svg = document.getElementById('selector-map-svg');
    if (!svg) return;
    // Dim all
    var allPolys = Array.prototype.slice.call(svg.querySelectorAll('.county-poly'));
    allPolys.forEach(function (p) {
      p.setAttribute('opacity', '0.55');
      p.setAttribute('stroke', '#fff');
      p.setAttribute('stroke-width', '1.5');
    });
    // Highlight chosen
    var chosen = svg.querySelector('[data-county="' + countyId + '"]');
    if (chosen) {
      chosen.setAttribute('opacity', '1');
      chosen.setAttribute('stroke', '#ffd700');
      chosen.setAttribute('stroke-width', '3');
    }
    MapUI._showSelectorInfo(countyId);
  };

  /* ── public API ────────────────────────────────────────────────────────── */
  MapUI.showCountySelector = function () {
    var overlay = document.getElementById('county-selector-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    MapUI.buildSVG(document.getElementById('county-selector-map'), 'selector');
    // Reset info panel
    var panel = document.getElementById('county-selector-info');
    if (panel) {
      panel.innerHTML = '<p class="muted" style="font-size:13px">Hover or click a county to see its resources, then claim it as your Empire.</p>';
      panel.style.display = 'block';
    }
  };

  MapUI.hideCountySelector = function () {
    var overlay = document.getElementById('county-selector-overlay');
    if (overlay) overlay.style.display = 'none';
  };

  MapUI.confirmCountySelection = function (countyId) {
    var county = MapData.COUNTY_MAP[countyId];
    if (!county) return;
    if (!Game.state.map) Game.state.map = { selectedCounty: null, pins: [] };
    Game.state.map.selectedCounty = countyId;
    Game.state.map.pins = [];
    Game.Save.save();
    MapUI.hideCountySelector();
    Game.UI.toast('You have claimed ' + county.name + ' County as your Empire! 🏴', 'info');
    MapUI.refresh();
    MapUI._updateEmpirePanel();
  };

  /* Auto-place a building pin into a suitable resource zone in the empire county. */
  MapUI.placeBuildingPin = function (buildingId) {
    var s = Game.state;
    if (!s.map || !s.map.selectedCounty) return;

    var terrainTypes = MapData.BUILDING_TERRAIN[buildingId];
    if (!terrainTypes) return; // space-age building, no terrain needed

    var county = MapData.COUNTY_MAP[s.map.selectedCounty];
    if (!county || !county.resources) return;

    var suitable = county.resources.filter(function (z) {
      return terrainTypes.indexOf(z.type) !== -1;
    });
    if (suitable.length === 0) return;

    // How many pins of this building type already exist in this county?
    var existing = s.map.pins.filter(function (p) {
      return p.buildingId === buildingId && p.countyId === s.map.selectedCounty;
    }).length;

    var zone = suitable[existing % suitable.length];

    // Small random jitter so stacked pins are visible
    var randomJitter = function () { return (Math.random() - 0.5) * 9; };

    s.map.pins.push({
      buildingId: buildingId,
      countyId: s.map.selectedCounty,
      x: zone.x + randomJitter(),
      y: zone.y + randomJitter(),
    });

    MapUI.refresh();
    MapUI._updateEmpirePanel();
  };

  /* Refresh both mini-map and full map SVGs. */
  MapUI.refresh = function () {
    var mini = document.getElementById('mini-map-container');
    if (mini) MapUI.buildSVG(mini, 'mini');
    var full = document.getElementById('full-map-container');
    if (full) MapUI.buildSVG(full, 'full');
  };

  /* Update the "Your Empire" info panel on the map tab. */
  MapUI._updateEmpirePanel = function () {
    var panel = document.getElementById('empire-info-panel');
    var miniPanel = document.getElementById('empire-info-panel-mini');
    var s = Game.state;

    if (!s.map || !s.map.selectedCounty) {
      var noEmpireHtml =
        '<p class="muted">No county selected yet. ' +
        '<button class="settings-btn" onclick="Game.MapUI.showCountySelector()" style="margin-left:8px">🗺️ Choose County</button></p>';
      if (panel) panel.innerHTML = noEmpireHtml;
      if (miniPanel) miniPanel.innerHTML =
        '<button class="settings-btn btn-tiny" onclick="Game.MapUI.showCountySelector()" style="margin-top:6px">🏴 Choose Your County</button>';
      MapUI._buildCountyRoster();
      return;
    }

    var county = MapData.COUNTY_MAP[s.map.selectedCounty];
    if (!county) return;

    // Count pins per building type
    var counts = {};
    (s.map.pins || []).forEach(function (p) {
      counts[p.buildingId] = (counts[p.buildingId] || 0) + 1;
    });

    var buildingLines = Object.keys(counts).map(function (bid) {
      var b = Game.config.buildingMap[bid];
      var icon = MapData.BUILDING_ICONS[bid] || '📌';
      return '<div class="empire-building-line">' +
        '<span>' + icon + ' ' + (b ? b.name : bid) + '</span>' +
        '<span class="empire-building-count">×' + counts[bid] + '</span>' +
      '</div>';
    }).join('');

    var header =
      '<div class="empire-header" style="border-left:4px solid ' + county.color + '">' +
        '<span class="empire-name">👑 ' + county.name + ' Empire</span>' +
        '<button class="settings-btn btn-tiny" onclick="Game.MapUI.showCountySelector()">Change</button>' +
      '</div>';

    var desc = '<p class="muted" style="font-size:12px;margin:6px 0">' + county.description + '</p>';

    var buildings = buildingLines
      ? '<div class="empire-buildings">' + buildingLines + '</div>'
      : '<p class="muted" style="font-size:12px">No buildings placed yet — buy buildings to populate your empire!</p>';

    if (panel) panel.innerHTML = header + desc + buildings;

    if (miniPanel) {
      var totalPins = (s.map.pins || []).length;
      miniPanel.innerHTML =
        '<div class="empire-mini-name" style="border-left:3px solid ' + county.color + '">' +
          '👑 ' + county.name + ' Empire' +
          (totalPins > 0 ? ' <span class="empire-building-count">(' + totalPins + ' buildings)</span>' : '') +
        '</div>';
    }

    MapUI._buildCountyRoster();
  };

  /* Build the county roster list on the map tab. */
  MapUI._buildCountyRoster = function () {
    var roster = document.getElementById('county-roster');
    if (!roster) return;
    var s = Game.state;
    var empireId = s.map ? s.map.selectedCounty : null;

    var html = '';
    for (var i = 0; i < MapData.COUNTIES.length; i++) {
      var c = MapData.COUNTIES[i];
      var isEmpire = c.id === empireId;
      var statusLabel = isEmpire
        ? '<span class="county-status status-empire">👑 Your Empire</span>'
        : '<span class="county-status status-rival">⚔ Rival</span>';
      html +=
        '<div class="county-roster-row' + (isEmpire ? ' roster-empire' : '') + '" ' +
          'style="border-left:3px solid ' + c.color + '">' +
          '<span class="roster-county-name">' + c.name + '</span>' +
          statusLabel +
        '</div>';
    }
    roster.innerHTML = html;
  };

  /* Build the terrain legend element. */
  MapUI._buildLegend = function (container) {
    var html = '<div class="map-legend">';
    Object.keys(MapData.TERRAIN_INFO).forEach(function (key) {
      var t = MapData.TERRAIN_INFO[key];
      html +=
        '<span class="legend-item terrain-' + key + '">' +
          '<span class="legend-dot" style="background:' + t.markerColor + ';border-color:' + t.markerBorder + '"></span>' +
          t.icon + ' ' + t.label +
        '</span>';
    });
    html += '<span class="legend-item"><span class="legend-dot pin-dot"></span>📌 Building</span>';
    html += '</div>';
    container.innerHTML = html;
  };

  /* ── initialization ────────────────────────────────────────────────────── */
  MapUI.init = function () {
    // Build legend
    var legendContainer = document.getElementById('map-legend-container');
    if (legendContainer) MapUI._buildLegend(legendContainer);

    // Initial renders
    MapUI.refresh();
    MapUI._updateEmpirePanel();
    MapUI._buildCountyRoster();

    // Show county selector for new games
    if (!Game.state.map || !Game.state.map.selectedCounty) {
      setTimeout(MapUI.showCountySelector, 600);
    }
  };

  Game.MapUI = MapUI;
})();
