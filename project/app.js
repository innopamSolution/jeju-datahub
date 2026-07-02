/* ============================================================
   Dashboard runtime — Wanted icon injection + trend chart.
   Icons reuse the Wanted Design System geometry (ICON_PATHS).
   ============================================================ */
(function () {
  var DS = window.WantedDesignSystem_68e8b7 || {};
  var PATHS = DS.ICON_PATHS || {};

  // A few solid glyphs the Wanted set doesn't ship, drawn in the same
  // fill style (24x24, currentColor) so they sit beside DS icons cleanly.
  var EXTRA = {
    "warning": [{ x: 0, y: 0, r: "evenodd",
      d: "M12 3 C12.66 3 13.27 3.35 13.6 3.93 L23.1 20.4 C23.43 20.97 23.43 21.67 23.1 22.24 C22.78 22.8 22.18 23.15 21.52 23.15 L2.48 23.15 C1.82 23.15 1.22 22.8 0.9 22.24 C0.57 21.67 0.57 20.97 0.9 20.4 L10.4 3.93 C10.73 3.35 11.34 3 12 3 Z M11 9.4 H13 V15 H11 Z M11 17.2 H13 V19.4 H11 Z" }],
    "chart": [
      { x: 0, y: 0, r: "nonzero", d: "M4 11.5 H7.2 V20.2 H4 Z" },
      { x: 0, y: 0, r: "nonzero", d: "M10.4 5.2 H13.6 V20.2 H10.4 Z" },
      { x: 0, y: 0, r: "nonzero", d: "M16.8 13.4 H20 V20.2 H16.8 Z" }
    ],
    "download": [
      { x: 0, y: 0, r: "nonzero", d: "M11 3.5 H13 V11.6 H15.7 C16.2 11.6 16.45 12.2 16.1 12.55 L12.4 16.25 C12.18 16.47 11.82 16.47 11.6 16.25 L7.9 12.55 C7.55 12.2 7.8 11.6 8.3 11.6 H11 Z" },
      { x: 0, y: 0, r: "nonzero", d: "M4.5 18.4 H19.5 C20.05 18.4 20.5 18.85 20.5 19.4 C20.5 19.95 20.05 20.4 19.5 20.4 H4.5 C3.95 20.4 3.5 19.95 3.5 19.4 C3.5 18.85 3.95 18.4 4.5 18.4 Z" }
    ],
    "car": [
      { x: 0, y: 0, r: "nonzero", d: "M4.6 12.6 L6 8.5 C6.34 7.5 7.28 6.8 8.34 6.8 H15.66 C16.72 6.8 17.66 7.5 18 8.5 L19.4 12.6 H20 C20.6 12.6 21 13 21 13.6 V15.8 C21 16.4 20.6 16.8 20 16.8 H4 C3.4 16.8 3 16.4 3 15.8 V13.6 C3 13 3.4 12.6 4 12.6 Z M7.4 12.4 H16.6 L15.6 9.2 C15.5 8.85 15.18 8.6 14.8 8.6 H9.2 C8.82 8.6 8.5 8.85 8.4 9.2 Z" },
      { x: 0, y: 0, r: "nonzero", d: "M5.9 17.2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 Z" },
      { x: 0, y: 0, r: "nonzero", d: "M13.7 17.2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 Z" }
    ]
  };

  function get(name) { return PATHS[name] || EXTRA[name]; }

  function svgFor(name, size) {
    var paths = get(name);
    if (!paths) return "";
    var inner = paths.map(function (p) {
      var fr = p.r === "evenodd" ? "evenodd" : "nonzero";
      var cr = p.r === "evenodd" ? ' clip-rule="evenodd"' : "";
      return '<path d="' + p.d + '" transform="translate(' + p.x + ' ' + p.y +
        ')" fill="currentColor" fill-rule="' + fr + '"' + cr + "></path>";
    }).join("");
    return '<svg class="ic" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" aria-hidden="true" style="display:inline-block;flex-shrink:0">' +
      inner + "</svg>";
  }

  function injectIcons() {
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      var name = el.getAttribute("data-icon");
      var size = parseInt(el.getAttribute("data-size") || "20", 10);
      el.innerHTML = svgFor(name, size);
      var span = el.firstChild;
      if (span) span.classList.add("ic");
    });
  }

  /* -------------------- Trend area chart -------------------- */
  function buildChart() {
    var host = document.getElementById("trendChart");
    if (!host) return;

    var W = 760, H = 300;
    var padL = 38, padR = 16, padT = 12, padB = 34;
    var iw = W - padL - padR, ih = H - padT - padB;
    var maxY = 60;
    var labels = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"];

    // hour-of-day series (12 points) — shape matches the source design
    var series = [
      { key: "illegal",  color: "var(--series-illegal)",  data: [16, 13, 11, 12, 18, 28, 36, 44, 50, 52, 47, 41] },
      { key: "double",   color: "var(--series-double)",   data: [8, 6, 5, 6, 10, 16, 22, 28, 31, 33, 30, 26] },
      { key: "facility", color: "var(--series-facility)", data: [4, 3, 3, 4, 6, 8, 10, 11, 12, 12, 11, 9] },
      { key: "etc",      color: "var(--series-etc)",      data: [3, 2, 2, 3, 4, 5, 6, 7, 7, 7, 6, 5] }
    ];

    var n = labels.length;
    function X(i) { return padL + (iw * i) / (n - 1); }
    function Y(v) { return padT + ih - (ih * v) / maxY; }

    // smooth path (catmull-rom -> bezier)
    function smooth(pts) {
      if (pts.length < 2) return "";
      var d = "M" + pts[0][0] + "," + pts[0][1];
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + p2[0] + "," + p2[1];
      }
      return d;
    }

    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="xMidYMid meet" font-family="var(--font-body)">'];

    // defs: area gradient for primary series
    svg.push('<defs><linearGradient id="gIllegal" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--series-illegal)" stop-opacity="0.18"></stop>' +
      '<stop offset="100%" stop-color="var(--series-illegal)" stop-opacity="0"></stop>' +
      '</linearGradient></defs>');

    // grid + y labels
    var ticks = [0, 15, 30, 45, 60];
    ticks.forEach(function (t) {
      var y = Y(t);
      svg.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y +
        '" stroke="var(--line-alternative)" stroke-width="1"></line>');
      svg.push('<text x="' + (padL - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="var(--text-assistive)">' + t + '</text>');
    });

    // x labels
    labels.forEach(function (lb, i) {
      svg.push('<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="var(--text-assistive)">' + lb + '시</text>');
    });

    // area under primary
    var s0 = series[0];
    var pts0 = s0.data.map(function (v, i) { return [X(i), Y(v)]; });
    var areaD = smooth(pts0) + " L" + X(n - 1) + "," + Y(0) + " L" + X(0) + "," + Y(0) + " Z";
    svg.push('<path d="' + areaD + '" fill="url(#gIllegal)"></path>');

    // lines (draw etc/facility first, primary last on top)
    series.slice().reverse().forEach(function (s) {
      var pts = s.data.map(function (v, i) { return [X(i), Y(v)]; });
      svg.push('<path d="' + smooth(pts) + '" fill="none" stroke="' + s.color +
        '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>');
    });

    svg.push("</svg>");
    host.innerHTML = svg.join("");
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () { injectIcons(); buildChart(); });
})();
