/* Vice Coast Cover Studio — a multi-panel GTA-style cover maker.
   Everything renders on one canvas: the live preview and the PNG export
   share the same drawCover() function, so what you see is what you get.
   Photos are read on this machine only and never uploaded anywhere. */
(function () {
  'use strict';

  var canvas = document.getElementById('preview');
  var ctx = canvas.getContext('2d');

  /* ---------- poster layouts (fractions of the cover) ---------- */
  var LAYOUTS = {
    grid4: {
      name: 'Four-panel grid',
      panels: [
        { x: 0.00, y: 0.00, w: 0.655, h: 0.655 },
        { x: 0.675, y: 0.00, w: 0.325, h: 0.318 },
        { x: 0.675, y: 0.338, w: 0.325, h: 0.317 },
        { x: 0.00, y: 0.675, w: 1.00, h: 0.325 }
      ]
    },
    hero3: {
      name: 'Hero + three',
      panels: [
        { x: 0.00, y: 0.00, w: 1.00, h: 0.60 },
        { x: 0.00, y: 0.62, w: 0.32, h: 0.38 },
        { x: 0.34, y: 0.62, w: 0.32, h: 0.38 },
        { x: 0.68, y: 0.62, w: 0.32, h: 0.38 }
      ]
    },
    single: {
      name: 'Full-bleed photo',
      panels: [{ x: 0, y: 0, w: 1, h: 1 }]
    }
  };

  /* ---------- colour grades ---------- */
  var GRADES = {
    sunset: {
      label: 'Vice Sunset',
      filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
      top: 'rgba(255, 122, 26, 0.20)', bottom: 'rgba(123, 47, 255, 0.28)',
      band: ['rgba(255, 46, 136, 0.85)', 'rgba(255, 122, 26, 0.55)']
    },
    neon: {
      label: 'Neon Night',
      filter: 'saturate(1.5) contrast(1.15) brightness(0.94)',
      top: 'rgba(255, 46, 136, 0.22)', bottom: 'rgba(0, 229, 255, 0.20)',
      band: ['rgba(0, 229, 255, 0.80)', 'rgba(255, 46, 136, 0.55)']
    },
    palm: {
      label: 'Palm Teal',
      filter: 'saturate(1.25) contrast(1.06)',
      top: 'rgba(15, 181, 166, 0.18)', bottom: 'rgba(20, 60, 90, 0.30)',
      band: ['rgba(15, 181, 166, 0.80)', 'rgba(255, 190, 80, 0.45)']
    },
    gold: {
      label: 'Golden Hour',
      filter: 'saturate(1.45) contrast(1.05) brightness(1.06)',
      top: 'rgba(255, 190, 80, 0.22)', bottom: 'rgba(255, 90, 40, 0.22)',
      band: ['rgba(255, 150, 40, 0.85)', 'rgba(255, 210, 90, 0.50)']
    }
  };

  /* ---------- state ---------- */
  var state = {
    layout: 'grid4',
    grade: 'sunset',
    title: 'Sunset Heist',
    subtitle: 'one last ride down the coast',
    titleSize: 84,
    lettering: 'sunset',
    grain: true,
    frame: true,
    exportSize: '1080x1080',
    selected: 0,
    photos: [],        // { img: HTMLImageElement, name: string }
    slots: [null, null, null, null]  // photo index per panel, or null
  };

  var PANEL_NAMES = ['the big hero panel', 'the top-right panel', 'the middle-right panel', 'the bottom strip'];

  /* ---------- film grain tile, made once ---------- */
  var grainTile = null;
  function makeGrain() {
    var t = document.createElement('canvas');
    t.width = 128; t.height = 128;
    var g = t.getContext('2d');
    var data = g.createImageData(128, 128);
    for (var i = 0; i < data.data.length; i += 4) {
      var v = Math.floor(Math.random() * 255);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v;
      data.data[i + 3] = 22;
    }
    g.putImageData(data, 0, 0);
    grainTile = t;
  }
  makeGrain();

  /* ---------- photo loading ---------- */
  function addPhotoFile(file) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      state.photos.push({ img: img, name: file.name || 'photo' });
      if (state.photos.length === 1) {
        for (var i = 0; i < state.slots.length; i++) state.slots[i] = 0;
      }
      renderTray();
      drawPreview();
    };
    img.src = url;
  }

  function loadDemoPhotos() {
    ['samples/boulevard.jpg', 'samples/pier.jpg'].forEach(function (src, i) {
      var img = new Image();
      img.onload = function () {
        state.photos.push({ img: img, name: src.split('/').pop() });
        if (i === 0) {
          for (var p = 0; p < state.slots.length; p++) state.slots[p] = 0;
        }
        renderTray();
        drawPreview();
      };
      img.src = src;
    });
  }

  function renderTray() {
    var tray = document.getElementById('tray');
    tray.innerHTML = '';
    state.photos.forEach(function (photo, i) {
      var thumb = document.createElement('img');
      thumb.src = photo.img.src;
      thumb.alt = photo.name;
      thumb.title = photo.name + ' — click, then click a panel';
      thumb.addEventListener('click', function () {
        state.slots[state.selected] = i;
        var thumbs = tray.querySelectorAll('img');
        thumbs.forEach(function (t) { t.classList.remove('selected'); });
        thumb.classList.add('selected');
        drawPreview();
      });
      tray.appendChild(thumb);
    });
  }

  /* ---------- geometry helpers ---------- */
  function coverDraw(c, img, px, py, pw, ph, zoom, ox, oy) {
    // Draw img into rect (px,py,pw,ph), cover-fit, zoomed, offset by ox/oy fractions.
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var base = Math.max(pw / iw, ph / ih);
    var scale = base * zoom;
    var dw = iw * scale, dh = ih * scale;
    var dx = px + (pw - dw) / 2 + ox * pw;
    var dy = py + (ph - dh) / 2 + oy * ph;
    c.drawImage(img, dx, dy, dw, dh);
  }

  function panelRects(W, H) {
    var layout = LAYOUTS[state.layout];
    return layout.panels.map(function (p) {
      return { x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H };
    });
  }

  function fitFont(c, text, maxWidth, startPx, family) {
    var size = startPx;
    c.font = '900 ' + size + 'px ' + family;
    while (size > 18 && c.measureText(text).width > maxWidth) {
      size -= 2;
      c.font = '900 ' + size + 'px ' + family;
    }
    return size;
  }

  /* ---------- the cover renderer (preview and export share this) ---------- */
  var FONT_STACK = '"Arial Black", "Archivo Black", "Segoe UI", system-ui, sans-serif';
  var SCRIPT_STACK = '"Brush Script MT", "Segoe Script", "Comic Sans MS", cursive';

  function drawCover(c, W, H) {
    var grade = GRADES[state.grade];
    var rects = panelRects(W, H);
    var frame = state.frame ? Math.round(W * 0.016) : 0;

    c.save();
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#1a0b2e';
    c.fillRect(0, 0, W, H);

    // Panels: each photo, graded, with a thin white gutter between them.
    rects.forEach(function (r, i) {
      c.save();
      c.beginPath();
      c.rect(r.x, r.y, r.w, r.h);
      c.clip();
      var photoIndex = state.slots[i];
      if (photoIndex !== null && state.photos[photoIndex]) {
        var slot = state.photos[photoIndex];
        var zoom = slotZooms[i] || 1;
        var off = slotOffsets[i] || { x: 0, y: 0 };
        c.filter = grade.filter;
        coverDraw(c, slot.img, r.x, r.y, r.w, r.h, zoom, off.x, off.y);
        c.filter = 'none';
      } else {
        var g = c.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
        g.addColorStop(0, '#3b115f');
        g.addColorStop(0.55, '#ff2e88');
        g.addColorStop(1, '#ff7a1a');
        c.fillStyle = g;
        c.fillRect(r.x, r.y, r.w, r.h);
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.font = '700 ' + Math.round(H * 0.028) + 'px ' + FONT_STACK;
        c.textAlign = 'center';
        c.fillText('ADD A PHOTO', r.x + r.w / 2, r.y + r.h / 2);
      }
      // Sunset wash over every panel.
      var wash = c.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      wash.addColorStop(0, grade.top);
      wash.addColorStop(1, grade.bottom);
      c.fillStyle = wash;
      c.fillRect(r.x, r.y, r.w, r.h);
      // Selected-panel outline (preview only, not on export).
      if (c === ctx && i === state.selected) {
        c.strokeStyle = '#ff2e88';
        c.lineWidth = Math.max(3, W * 0.006);
        c.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      }
      c.restore();
    });

    // White gutters between panels.
    c.strokeStyle = '#fff7ee';
    c.lineWidth = Math.max(2, W * 0.008);
    rects.forEach(function (r) { c.strokeRect(r.x, r.y, r.w, r.h); });

    // Outer white poster frame, drawn before the caption and badge so the
    // lettering sits on top of it instead of hiding underneath it.
    if (frame > 0) {
      c.strokeStyle = '#fff7ee';
      c.lineWidth = frame * 2;
      c.strokeRect(frame, frame, W - frame * 2, H - frame * 2);
    }

    // Caption band across the bottom.
    var bandH = H * 0.20;
    var bandY = H - bandH;
    var bandGrad = c.createLinearGradient(0, bandY, 0, H);
    bandGrad.addColorStop(0, 'rgba(20, 6, 40, 0)');
    bandGrad.addColorStop(0.35, 'rgba(20, 6, 40, 0.55)');
    bandGrad.addColorStop(1, 'rgba(20, 6, 40, 0.88)');
    c.fillStyle = bandGrad;
    c.fillRect(0, bandY, W, H - bandY);

    var pad = W * 0.045;
    var titlePx = (state.titleSize / 84) * H * 0.115;
    var titleSize = fitFont(c, state.title.toUpperCase(), W - pad * 2, titlePx, FONT_STACK);
    var titleY = H - H * 0.075;

    c.save();
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.lineJoin = 'round';
    c.font = '900 ' + titleSize + 'px ' + FONT_STACK;
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = titleSize * 0.12;
    c.shadowOffsetY = titleSize * 0.04;
    if (state.lettering === 'sunset') {
      var tg = c.createLinearGradient(0, titleY - titleSize, 0, titleY);
      tg.addColorStop(0, '#ffe259');
      tg.addColorStop(0.5, '#ff7a1a');
      tg.addColorStop(1, '#ff2e88');
      c.fillStyle = tg;
      c.strokeStyle = '#ffffff';
      c.lineWidth = titleSize * 0.06;
      c.strokeText(state.title.toUpperCase(), pad, titleY);
      c.fillText(state.title.toUpperCase(), pad, titleY);
    } else if (state.lettering === 'neon') {
      c.fillStyle = '#ff5db1';
      c.strokeStyle = '#ffffff';
      c.lineWidth = titleSize * 0.05;
      c.shadowColor = '#ff2e88';
      c.shadowBlur = titleSize * 0.35;
      c.strokeText(state.title.toUpperCase(), pad, titleY);
      c.fillText(state.title.toUpperCase(), pad, titleY);
    } else if (state.lettering === 'ink') {
      c.fillStyle = '#14101c';
      c.strokeStyle = '#ffffff';
      c.lineWidth = titleSize * 0.07;
      c.strokeText(state.title.toUpperCase(), pad, titleY);
      c.fillText(state.title.toUpperCase(), pad, titleY);
    } else {
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#14101c';
      c.lineWidth = titleSize * 0.05;
      c.strokeText(state.title.toUpperCase(), pad, titleY);
      c.fillText(state.title.toUpperCase(), pad, titleY);
    }
    c.restore();

    // Subtitle in a loose script hand, under the title.
    if (state.subtitle.trim()) {
      c.save();
      c.textAlign = 'left';
      c.font = 'italic 700 ' + Math.round(H * 0.032) + 'px ' + SCRIPT_STACK;
      c.fillStyle = '#ffe9f3';
      c.shadowColor = 'rgba(0,0,0,0.5)';
      c.shadowBlur = 6;
      c.fillText(state.subtitle, pad + 4, H - H * 0.028);
      c.restore();
    }

    // Badge: small invented mark, top-left of the hero panel.
    if (state.frame) {
      var bw = W * 0.17, bh = H * 0.038;
      var bx = rects[0].x + W * 0.02, by = rects[0].y + H * 0.02;
      c.save();
      c.fillStyle = '#ff2e88';
      c.beginPath();
      c.roundRect(bx, by, bw, bh, bh / 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = '800 ' + Math.round(bh * 0.52) + 'px ' + FONT_STACK;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('★ VICE COAST', bx + bw / 2, by + bh / 2 + 1);
      c.restore();
    }

    // Grain and vignette.
    if (state.grain) {
      var pat = c.createPattern(grainTile, 'repeat');
      c.save();
      c.globalAlpha = 0.5;
      c.fillStyle = pat;
      c.fillRect(0, 0, W, H);
      c.restore();
      var vig = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(10, 4, 24, 0.42)');
      c.fillStyle = vig;
      c.fillRect(0, 0, W, H);
    }
    c.restore();
  }

  // Per-panel crop state: zoom and pan offsets, kept beside the photo slots.
  var slotZooms = [1, 1, 1, 1];
  var slotOffsets = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];

  function drawPreview() {
    if (document.body.classList.contains('shot')) {
      drawCover(ctx, canvas.width, canvas.height);
      return;
    }
    var size = state.exportSize.split('x');
    var w = parseInt(size[0], 10), h = parseInt(size[1], 10);
    var scale = Math.min(900 / w, 900 / h);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    drawCover(ctx, canvas.width, canvas.height);
    var label = document.getElementById('sizeLabel');
    if (label) label.textContent = state.exportSize.replace('x', ' × ');
  }

  /* ---------- export ---------- */
  function exportCover(sizeText) {
    var parts = sizeText.split('x');
    var W = parseInt(parts[0], 10), H = parseInt(parts[1], 10);
    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var octx = off.getContext('2d');
    // Export draws the same cover without the editor's selection outline.
    drawCover(octx, W, H);
    off.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vice-coast-cover-' + sizeText + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }, 'image/png');
  }

  /* ---------- UI wiring ---------- */
  function bindSeg(id, key, onPick) {
    var seg = document.getElementById(id);
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-' + key + ']');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state[key === 'layout' ? 'layout' : 'grade'] = btn.dataset[key];
      if (onPick) onPick(btn.dataset[key]);
      drawPreview();
    });
  }
  bindSeg('layoutSeg', 'layout');
  bindSeg('gradeSeg', 'grade');

  document.getElementById('titleInput').addEventListener('input', function (e) {
    state.title = e.target.value || 'Untitled';
    drawPreview();
  });
  document.getElementById('subInput').addEventListener('input', function (e) {
    state.subtitle = e.target.value;
    drawPreview();
  });
  document.getElementById('titleSize').addEventListener('input', function (e) {
    state.titleSize = parseInt(e.target.value, 10);
    drawPreview();
  });
  document.getElementById('letterStyle').addEventListener('change', function (e) {
    state.lettering = e.target.value;
    drawPreview();
  });
  document.getElementById('grainToggle').addEventListener('change', function (e) {
    state.grain = e.target.checked;
    drawPreview();
  });
  document.getElementById('frameToggle').addEventListener('change', function (e) {
    state.frame = e.target.checked;
    drawPreview();
  });

  document.getElementById('photoInput').addEventListener('change', function (e) {
    Array.prototype.forEach.call(e.target.files, addPhotoFile);
    e.target.value = '';
  });
  document.getElementById('demoBtn').addEventListener('click', loadDemoPhotos);
  document.getElementById('resetBtn').addEventListener('click', function () {
    state.slots = [null, null, null, null];
    slotZooms = [1, 1, 1, 1];
    slotOffsets = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    state.selected = 0;
    document.getElementById('zoomInput').value = 100;
    updatePanelLabel();
    drawPreview();
  });
  document.getElementById('fillAllBtn').addEventListener('click', function () {
    if (!state.photos.length) return;
    for (var i = 0; i < state.slots.length; i++) state.slots[i] = 0;
    drawPreview();
  });
  document.getElementById('zoomInput').addEventListener('input', function (e) {
    slotZooms[state.selected] = parseInt(e.target.value, 10) / 100;
    drawPreview();
  });
  document.getElementById('centerBtn').addEventListener('click', function () {
    slotOffsets[state.selected] = { x: 0, y: 0 };
    slotZooms[state.selected] = 1;
    document.getElementById('zoomInput').value = 100;
    drawPreview();
  });
  document.getElementById('swapBtn').addEventListener('click', function () {
    if (!state.photos.length) return;
    var cur = state.slots[state.selected];
    state.slots[state.selected] = cur === null ? 0 : (cur + 1) % state.photos.length;
    drawPreview();
  });

  document.querySelectorAll('[data-export]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.exportSize = btn.dataset.export;
      drawPreview();
      exportCover(btn.dataset.export);
    });
  });

  function updatePanelLabel() {
    var label = document.getElementById('panelLabel');
    var n = state.selected + 1;
    label.textContent = 'Panel ' + n + ' — ' + PANEL_NAMES[state.selected] +
      '. Zoom ' + Math.round((slotZooms[state.selected] || 1) * 100) + '%.';
  }

  /* ---------- pointer: pick a panel, drag to pan, wheel to zoom ---------- */
  var dragging = null;
  function canvasPoint(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }
  function pickPanel(p) {
    var rects = panelRects(canvas.width, canvas.height);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) return i;
    }
    return 0;
  }
  canvas.addEventListener('pointerdown', function (e) {
    var p = canvasPoint(e);
    state.selected = pickPanel(p);
    document.getElementById('zoomInput').value = Math.round((slotZooms[state.selected] || 1) * 100);
    updatePanelLabel();
    dragging = { last: p };
    canvas.setPointerCapture(e.pointerId);
    drawPreview();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var p = canvasPoint(e);
    var off = slotOffsets[state.selected];
    var rects = panelRects(canvas.width, canvas.height);
    var r = rects[state.selected];
    off.x += (p.x - dragging.last.x) / r.w;
    off.y += (p.y - dragging.last.y) / r.h;
    off.x = Math.max(-0.6, Math.min(0.6, off.x));
    off.y = Math.max(-0.6, Math.min(0.6, off.y));
    dragging.last = p;
    drawPreview();
  });
  canvas.addEventListener('pointerup', function () { dragging = null; });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = canvasPoint(e);
    state.selected = pickPanel(p);
    var z = (slotZooms[state.selected] || 1) * (e.deltaY < 0 ? 1.08 : 0.93);
    slotZooms[state.selected] = Math.max(1, Math.min(2.6, z));
    document.getElementById('zoomInput').value = Math.round(slotZooms[state.selected] * 100);
    updatePanelLabel();
    drawPreview();
  }, { passive: false });

  /* ---------- shot mode: ?shot=cover draws one cover full-frame ---------- */
  var params = new URLSearchParams(window.location.search);
  if (params.get('shot') === 'cover') {
    document.body.classList.add('shot');
    if (params.get('layout') && LAYOUTS[params.get('layout')]) state.layout = params.get('layout');
    if (params.get('grade') && GRADES[params.get('grade')]) state.grade = params.get('grade');
    if (params.get('caption')) state.title = params.get('caption');
    if (params.get('subtitle')) state.subtitle = params.get('subtitle');
    if (params.get('size')) state.exportSize = params.get('size');
    var vw = window.innerWidth, vh = window.innerHeight;
    canvas.width = vw; canvas.height = vh;
    var drawShot = function () { drawCover(ctx, vw, vh); };
    window.addEventListener('resize', drawShot);
    // Draw once now (demo photos load async and redraw when they arrive).
    drawShot();
    window.__shotReady = true;
  } else {
    drawPreview();
  }
  updatePanelLabel();
  loadDemoPhotos();
})();
