/* md2docsite diagram runtime — tool-owned, regenerated every build.
 * Frames each Mermaid block, themes it to the site's --m2d-* tokens, and adds
 * ctrl/cmd-wheel zoom, drag-pan, and +/-/reset controls. Adapted from the
 * md2html-v2 single-file renderer. Do not hand-edit.
 */
(function () {
  'use strict';
  if (window.__md2docsiteDiagrams) return;
  window.__md2docsiteDiagrams = true;

  // Cancel mermaid's startOnLoad before DOMContentLoaded fires (this file is
  // loaded right after mermaid.min.js, before DOMContentLoaded).
  if (window.mermaid && mermaid.initialize) {
    try {
      mermaid.initialize({ startOnLoad: false });
    } catch (e) {}
  }

  var ZOOM_MIN = 0.4,
    ZOOM_MAX = 8;
  var TYPE_LABELS = {
    erdiagram: 'ER DIAGRAM',
    flowchart: 'FLOWCHART',
    graph: 'FLOWCHART',
    sequencediagram: 'SEQUENCE',
    classdiagram: 'CLASS',
    gantt: 'GANTT',
    journey: 'JOURNEY',
    pie: 'PIE',
    mindmap: 'MINDMAP',
    timeline: 'TIMELINE',
    gitgraph: 'GIT',
    quadrantchart: 'QUADRANT',
  };

  function injectCss() {
    if (document.getElementById('m2d-diagram-css')) return;
    var css =
      'figure.diagram{background:var(--m2d-surface,var(--md-default-bg-color));border:1.5px solid var(--m2d-border-strong,var(--md-default-fg-color--lightest));border-radius:10px;margin:1em 0;overflow:hidden;}' +
      'figure.diagram figcaption.diagram-head{display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--m2d-surface-alt,var(--md-default-fg-color--lightest));border-bottom:1.5px solid var(--m2d-border-strong,var(--md-default-fg-color--lightest));font-family:var(--m2d-font-mono,monospace);font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--m2d-text-faint,var(--md-default-fg-color--light));}' +
      'figure.diagram .diagram-type{color:var(--m2d-accent-strong,var(--md-accent-fg-color));font-weight:600;}' +
      'figure.diagram .diagram-src-toggle{margin-left:auto;font-family:inherit;font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;background:var(--m2d-bg,transparent);border:1px solid var(--m2d-border-strong,var(--md-default-fg-color--lightest));border-radius:4px;cursor:pointer;color:var(--m2d-text-muted,var(--md-default-fg-color--light));}' +
      'figure.diagram .diagram-viewport{position:relative;overflow:hidden;background:var(--m2d-surface,var(--md-default-bg-color));cursor:grab;touch-action:none;}' +
      'figure.diagram .diagram-viewport.dragging{cursor:grabbing;}' +
      'figure.diagram .diagram-render{padding:18px;display:flex;justify-content:center;transform-origin:0 0;will-change:transform;}' +
      'figure.diagram .diagram-render svg{max-width:100%;height:auto;}' +
      'figure.diagram .diagram-zoom{position:absolute;top:8px;right:8px;display:flex;gap:2px;background:var(--m2d-surface,var(--md-default-bg-color));border:1px solid var(--m2d-border-strong,var(--md-default-fg-color--lightest));border-radius:6px;padding:2px;opacity:0;transition:opacity .15s ease;}' +
      'figure.diagram .diagram-viewport:hover .diagram-zoom,figure.diagram .diagram-zoom:focus-within{opacity:1;}' +
      'figure.diagram .diagram-zoom button{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:none;border-radius:4px;background:transparent;color:var(--m2d-text-muted,var(--md-default-fg-color--light));cursor:pointer;}' +
      'figure.diagram .diagram-zoom button:hover{background:var(--m2d-highlight,var(--md-default-fg-color--lightest));}' +
      'figure.diagram .diagram-zoom button svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}' +
      'figure.diagram pre.diagram-source{background:var(--m2d-code-bg,#141413);color:var(--m2d-code-text,#faf9f5);font-family:var(--m2d-font-mono,monospace);font-size:13px;padding:16px 20px;overflow-x:auto;margin:0;white-space:pre;}' +
      'figure.diagram pre.diagram-source[hidden]{display:none;}' +
      '@media print{figure.diagram .diagram-zoom{display:none!important;}figure.diagram .diagram-viewport{overflow:visible!important;}figure.diagram .diagram-render{transform:none!important;}}';
    var s = document.createElement('style');
    s.id = 'm2d-diagram-css';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }
  function mermaidTokens() {
    return {
      background: cssVar('--m2d-surface', '#ffffff'),
      mainBkg: cssVar('--m2d-surface-alt', '#f0eee6'),
      primaryColor: cssVar('--m2d-surface-alt', '#f0eee6'),
      primaryTextColor: cssVar('--m2d-text', '#141413'),
      primaryBorderColor: cssVar('--m2d-border-strong', '#d1cfc5'),
      secondaryColor: cssVar('--m2d-highlight', '#e3dacc'),
      tertiaryColor: cssVar('--m2d-bg', '#faf9f5'),
      lineColor: cssVar('--m2d-text-faint', '#87867f'),
      textColor: cssVar('--m2d-text-muted', '#3d3d3a'),
      nodeBorder: cssVar('--m2d-border-strong', '#d1cfc5'),
      clusterBkg: cssVar('--m2d-bg', '#faf9f5'),
      edgeLabelBackground: cssVar('--m2d-surface', '#ffffff'),
      attributeBackgroundColorOdd: cssVar('--m2d-surface', '#ffffff'),
      attributeBackgroundColorEven: cssVar('--m2d-surface-alt', '#f0eee6'),
      fontFamily: cssVar('--m2d-font-sans', 'system-ui, sans-serif'),
      fontSize: '14px',
    };
  }

  function detectType(src) {
    var lines = src.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (!ln || ln.indexOf('%%') === 0) continue;
      if (ln.toLowerCase().indexOf('statediagram') === 0) return 'STATE';
      var word = ln.split(/[\s{:\-]/)[0].toLowerCase();
      return TYPE_LABELS[word] || 'DIAGRAM';
    }
    return 'DIAGRAM';
  }

  // Turn a bare <pre class="mermaid"> (superfences output) into a framed figure
  // whose render target is NOT class="mermaid", so any Material integration
  // never double-processes it.
  function buildFigures() {
    var raw = document.querySelectorAll(
      'pre.md2-mermaid:not([data-m2d-done]), div.md2-mermaid:not([data-m2d-done])',
    );
    Array.prototype.forEach.call(raw, function (pre) {
      pre.setAttribute('data-m2d-done', '1');
      var src = (pre.textContent || '').replace(/^\n+/, '').replace(/\n+$/, '');
      var fig = document.createElement('figure');
      fig.className = 'diagram';
      var cap = document.createElement('figcaption');
      cap.className = 'diagram-head';
      var word = document.createElement('span');
      word.textContent = 'MERMAID';
      var type = document.createElement('span');
      type.className = 'diagram-type';
      type.textContent = detectType(src);
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'diagram-src-toggle';
      toggle.textContent = 'Source';
      cap.appendChild(word);
      cap.appendChild(type);
      cap.appendChild(toggle);
      var target = document.createElement('div');
      target.className = 'diagram-render';
      target.textContent = src;
      var source = document.createElement('pre');
      source.className = 'diagram-source';
      source.hidden = true;
      source.textContent = src;
      toggle.addEventListener('click', function () {
        source.hidden = !source.hidden;
      });
      fig.appendChild(cap);
      fig.appendChild(target);
      fig.appendChild(source);
      pre.parentNode.replaceChild(fig, pre);
    });
  }

  function setupZoom() {
    document.querySelectorAll('figure.diagram').forEach(function (fig) {
      var m = fig.querySelector('.diagram-render');
      if (!m) return;
      var vp = m.closest('.diagram-viewport');
      if (vp) {
        if (vp._reset) vp._reset();
        return;
      }
      vp = document.createElement('div');
      vp.className = 'diagram-viewport';
      m.parentNode.insertBefore(vp, m);
      vp.appendChild(m);
      var ctrl = document.createElement('div');
      ctrl.className = 'diagram-zoom';
      ctrl.innerHTML =
        '<button type="button" data-zoom="out" aria-label="Zoom out"><svg viewBox="0 0 16 16"><path d="M3.5 8h9"/></svg></button>' +
        '<button type="button" data-zoom="in" aria-label="Zoom in"><svg viewBox="0 0 16 16"><path d="M8 3.5v9M3.5 8h9"/></svg></button>' +
        '<button type="button" data-zoom="reset" aria-label="Reset view"><svg viewBox="0 0 16 16"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M13.5 2v3h-3"/></svg></button>';
      vp.appendChild(ctrl);
      var scale = 1,
        tx = 0,
        ty = 0;
      function apply() {
        m.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      }
      function reset() {
        scale = 1;
        tx = 0;
        ty = 0;
        m.style.transform = '';
      }
      vp._reset = reset;
      function zoomAt(px, py, f) {
        var next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale * f));
        f = next / scale;
        if (f === 1) return;
        tx = px - (px - tx) * f;
        ty = py - (py - ty) * f;
        scale = next;
        apply();
      }
      vp.addEventListener(
        'wheel',
        function (e) {
          if (!e.ctrlKey && !e.metaKey) return; // plain scroll still pages the doc
          e.preventDefault();
          var r = vp.getBoundingClientRect();
          zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
        },
        { passive: false },
      );
      ctrl.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-zoom]');
        if (!b) return;
        var k = b.getAttribute('data-zoom');
        if (k === 'reset') {
          reset();
          return;
        }
        var r = vp.getBoundingClientRect();
        zoomAt(r.width / 2, r.height / 2, k === 'in' ? 1.25 : 1 / 1.25);
      });
      var drag = null;
      vp.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.diagram-zoom')) return;
        drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
        vp.classList.add('dragging');
        try {
          vp.setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      vp.addEventListener('pointermove', function (e) {
        if (!drag) return;
        tx = drag.tx + (e.clientX - drag.x);
        ty = drag.ty + (e.clientY - drag.y);
        apply();
      });
      function end() {
        if (drag) {
          drag = null;
          vp.classList.remove('dragging');
        }
      }
      vp.addEventListener('pointerup', end);
      vp.addEventListener('pointercancel', end);
    });
  }

  function runMermaid() {
    if (!window.mermaid || !mermaid.run) {
      document.querySelectorAll('figure.diagram .diagram-source').forEach(function (s) {
        s.hidden = false;
      });
      return;
    }
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: mermaidTokens(),
      });
    } catch (e) {}
    document.querySelectorAll('figure.diagram .diagram-render').forEach(function (t) {
      t.removeAttribute('data-processed');
    });
    mermaid
      .run({ querySelector: 'figure.diagram .diagram-render', suppressErrors: true })
      .then(setupZoom)
      .catch(function (e) {
        console.error(e);
        setupZoom();
      });
  }

  function render() {
    if (!document.querySelector('pre.md2-mermaid, div.md2-mermaid, figure.diagram')) return;
    injectCss();
    buildFigures();
    runMermaid();
  }

  function reRenderThemed() {
    document.querySelectorAll('figure.diagram').forEach(function (fig) {
      var t = fig.querySelector('.diagram-render'),
        s = fig.querySelector('.diagram-source');
      if (t && s) {
        t.removeAttribute('data-processed');
        t.textContent = s.textContent;
      }
      var vp = fig.querySelector('.diagram-viewport');
      if (vp && vp._reset) vp._reset();
    });
    runMermaid();
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    render();
    try {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].attributeName === 'data-md-color-scheme') {
            reRenderThemed();
            break;
          }
        }
      }).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
    } catch (e) {}
  });
})();
