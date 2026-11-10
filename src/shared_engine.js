// ============================================================================
// SHARED OEM CONNECTOR SVG & VERDICT ENGINE
// ============================================================================

const COLOR_MAP = {
  "BLK": "#18181B", "BK": "#18181B",
  "WHT": "#F8FAFC", "WH": "#F8FAFC", "WT": "#F8FAFC",
  "RED": "#EF4444", "RD": "#EF4444",
  "PNK": "#F472B6", "PK": "#F472B6",
  "ORN": "#F97316", "OG": "#F97316",
  "YEL": "#FACC15", "YE": "#FACC15",
  "LT GRN": "#4ADE80", "L-GN": "#4ADE80", "LGN": "#4ADE80",
  "DK GRN": "#15803D", "D-GN": "#15803D", "GRN": "#22C55E", "GN": "#22C55E",
  "LT BLU": "#38BDF8", "L-BU": "#38BDF8", "LBU": "#38BDF8",
  "DK BLU": "#2563EB", "D-BU": "#2563EB", "DBU": "#2563EB", "BLU": "#2563EB", "BU": "#2563EB",
  "PPL": "#A855F7", "PU": "#A855F7", "VT": "#8B5CF6",
  "TAN": "#D6B388", "TN": "#D6B388",
  "BRN": "#854D0E", "BN": "#854D0E",
  "GRY": "#94A3B8", "GY": "#94A3B8", "GRA": "#94A3B8"
};

function getWireSwatchStyle(wireStr) {
  if (!wireStr || wireStr === "--" || wireStr.toLowerCase().includes("not used") || wireStr.toLowerCase().includes("empty")) {
    return "background: #27272A; border-color: #3F3F46;";
  }
  const clean = wireStr.replace(/^[0-9.]+\s+/, "").split("(")[0].split("->")[0].trim().toUpperCase();
  const parts = clean.split("/");
  function matchColor(tok) {
    tok = tok.trim();
    if (COLOR_MAP[tok]) return COLOR_MAP[tok];
    for (const [k, v] of Object.entries(COLOR_MAP)) {
      if (tok.includes(k)) return v;
    }
    return "#64748B";
  }
  const c1 = matchColor(parts[0]);
  if (parts.length > 1) {
    const c2 = matchColor(parts[1]);
    return `background: linear-gradient(135deg, ${c1} 0%, ${c1} 55%, ${c2} 55%, ${c2} 100%);`;
  }
  return `background: ${c1};`;
}

function computeVerdictWithConfig(pinObj, ecm, conn, cfg) {
  const transCfg = cfg.trans || "4l60e";
  const throttleCfg = cfg.throttle || "auto";
  const fansCfg = cfg.fans || "pcm";
  const acCfg = cfg.ac || "delete";
  const emCfg = cfg.emissions || "offroad";

  const pnum = String(pinObj.pin);
  const ckt = String(pinObj.circuit || "").trim();
  const flags = pinObj.flags || [];
  let status = pinObj.status;

  // 4L80E Repin Alerts on Gen III 99-07 PCMs (C1 & C2)
  if (transCfg === "4l80e" && ecm.id.startsWith("gen3_") && ecm.id !== "gen3_97_98_ls1") {
    if (conn.id === "C1" && pnum === "79") {
      return {
        status: "repin",
        shortLabel: "Move -> C2-22",
        badgeText: "4L80E: Move to C2-22",
        plainAction: "Move this White wire out of C1 Pin 79 and push it into C2 Pin 22 (4L80E Input Speed Sensor High)."
      };
    }
    if (conn.id === "C2" && pnum === "42") {
      return {
        status: "repin",
        shortLabel: "Move -> C2-23",
        badgeText: "4L80E: Move to C2-23",
        plainAction: "Move this Tan/Black wire out of C2 Pin 42 and push it into C2 Pin 23 (4L80E Input Speed Sensor Low)."
      };
    }
    if (conn.id === "C2" && (pnum === "22" || pnum === "23")) {
      return {
        status: "repin",
        shortLabel: "4L80E ISS Pin",
        badgeText: pnum === "22" ? "4L80E ISS High (from C1-79)" : "4L80E ISS Low (from C2-42)",
        plainAction: pnum === "22"
          ? "Insert the White wire (removed from C1 Pin 79) into C2 Pin 22 for 4L80E Input Speed Sensor High."
          : "Insert the Tan/Black wire (removed from C2 Pin 42) into C2 Pin 23 for 4L80E Input Speed Sensor Low."
      };
    }
  }

  // 4L80E Repin Alerts directly on the 20-Pin Round Transmission Plug
  if (transCfg === "4l80e" && conn.id === "4L60_80_20") {
    if (pnum === "S") {
      return {
        status: "repin",
        shortLabel: "4L80E Repin",
        badgeText: "Pull WHT -> Insert BRN (from U)",
        plainAction: "4L80E Conversion: Remove White wire from Pin S (route to front ISS sensor), then move Brown wire from Pin U into Pin S!"
      };
    }
    if (pnum === "T") {
      return {
        status: "repin",
        shortLabel: "Pull for ISS",
        badgeText: "Pull TAN/BLK for 4L80E ISS",
        plainAction: "4L80E Conversion: Remove Tan/Black wire from Pin T, route it with the White wire to a 2-pin 4L80E ISS plug, and seal cavity T with silicone."
      };
    }
    if (pnum === "U") {
      return {
        status: "repin",
        shortLabel: "Move -> Pin S",
        badgeText: "Move BRN Wire -> Pin S",
        plainAction: "4L80E Conversion: Move this Brown TCC PWM wire from cavity U into cavity S, then seal cavity U with silicone."
      };
    }
  }

  // Electric Fan Add-Pin Alert on 99-07 Vortec Trucks
  if (fansCfg === "pcm" && (ecm.id === "gen3_99_02_vortec" || ecm.id === "gen3_03_07_vortec")) {
    if (conn.id === "C1" && pnum === "42") {
      return {
        status: "external",
        shortLabel: "Fan 1 (Add Pin)",
        badgeText: "Fan 1 Low Relay (Add Pin)",
        plainAction: "99-06 trucks came with mechanical fans so C1-42 is usually empty. Push a PCM terminal into C1-42 to trigger Low-Speed Fan Relay #1 (PCM supplies ground)."
      };
    }
    if (conn.id === "C2" && pnum === "33") {
      return {
        status: "external",
        shortLabel: "Fan 2 (Add Pin)",
        badgeText: "Fan 2 High Relay (Add Pin)",
        plainAction: "Add or connect C2-33 to trigger High-Speed Fan Relay #2/#3 (PCM supplies ground)."
      };
    }
  }

  // DBC Conversion Alerts on 03-07 P59
  if (throttleCfg === "dbc" && ecm.id === "gen3_03_07_vortec") {
    if (conn.id === "C1" && (pnum === "14" || pnum === "15")) {
      return {
        status: "remove",
        shortLabel: "Remove (DBW)",
        badgeText: "Remove (DBW TAC Wire)",
        plainAction: "Depin TAC module serial wires on C1-14 & C1-15 when converting to a cable throttle body."
      };
    }
    if (conn.id === "C1" && ["8", "24", "76", "77", "78", "79"].includes(pnum)) {
      return {
        status: "repin",
        shortLabel: "Add DBC Wire",
        badgeText: "DBC TPS / IAC Pin",
        plainAction: "Populate C1-8 (TPS 5V), C1-24 (TPS Signal), and C1-76..79 (IAC Coils) for cable throttle. Verify your P59 PCM has the B67U1 IAC chip!"
      };
    }
  }

  if (status === "empty") {
    return { status: "empty", shortLabel: "Empty", badgeText: "Empty Cavity", plainAction: "" };
  }

  if (flags.includes("o2_rear") || flags.includes("evap_egr")) {
    return emCfg === "emissions"
      ? { status: "keep", shortLabel: "Keep (Emissions)", badgeText: "Keep (Emissions Legal)", plainAction: "Keep connected because 50-State / Emissions mode is active." }
      : { status: "remove", shortLabel: "Remove", badgeText: "Safe to Remove (Emissions)", plainAction: "" };
  }

  if (flags.includes("ac")) {
    return acCfg === "keep"
      ? { status: "keep", shortLabel: "Keep (A/C)", badgeText: "Keep (OEM PCM A/C)", plainAction: "Keep connected because OEM PCM A/C control is active." }
      : { status: "remove", shortLabel: "Remove (A/C)", badgeText: "Safe to Remove (A/C Delete)", plainAction: "" };
  }

  if (flags.includes("fan")) {
    return fansCfg === "pcm"
      ? { status: "external", shortLabel: "Hook Up (Fan)", badgeText: "Wire to Fan Relay", plainAction: "" }
      : { status: "remove", shortLabel: "Not Needed", badgeText: "Not Needed (Mech Fan)", plainAction: "" };
  }

  if (flags.includes("trans") || status === "trans") {
    if (ckt === "821" || ckt === "822" || ckt === "400" || ckt === "401") {
      return {
        status: "keep",
        shortLabel: "Keep (VSS)",
        badgeText: "Keep (VSS Speed Input)",
        plainAction: "Keep the VSS speed sensor twisted pair even on manual swaps to prevent stalling when coasting to a stop!"
      };
    }
    return transCfg === "manual"
      ? { status: "remove", shortLabel: "Remove (Manual)", badgeText: "Remove (No Auto Trans)", plainAction: "Not needed with a manual or non-electronic automatic transmission." }
      : { status: "trans", shortLabel: "Auto Trans", badgeText: "Keep (Auto Trans)", plainAction: "" };
  }

  if (throttleCfg === "dbc" && flags.includes("dbw")) {
    return { status: "remove", shortLabel: "Remove (DBW)", badgeText: "Remove (Cable Throttle)", plainAction: "" };
  }
  if (throttleCfg === "dbw" && flags.includes("dbc")) {
    return { status: "remove", shortLabel: "Remove (DBC)", badgeText: "Remove (Drive-By-Wire)", plainAction: "" };
  }

  if (status === "external") {
    return { status: "external", shortLabel: "Hook Up", badgeText: "Hook Up (Standalone)", plainAction: "" };
  }
  if (status === "remove") {
    return { status: "remove", shortLabel: "Remove", badgeText: "Safe to Remove", plainAction: "" };
  }
  return { status: "keep", shortLabel: "Keep", badgeText: "Keep in Harness", plainAction: "" };
}

const CONNECTOR_LAYOUT_META = {
  pcm_80:       { label: "OEM Micro-Pack 100W • 2×40 w/ Center 7mm Bolt", hasBanks: true },
  mx123_80:     { label: "Molex MX123 Sealed • 4×20 Factory Matrix", hasBanks: false },
  mx123_73:     { label: "Molex MX123 Sealed • 72 Micro + Pin 73 (2.8mm Blade)", hasBanks: false },
  mx123_56:     { label: "Molex MX123 Sealed • 4×14 Factory Matrix", hasBanks: false },
  t42_49:       { label: "Aptiv 15463921 Hybrid • 3×16 Micro-64 + Pin 49 GT 280 Blade", hasBanks: false },
  fuseblock_c2: { label: "OEM Underhood Fuseblock • 6×12 Grid (A–F × 1–12)", hasBanks: false },
  c100_16:      { label: "OEM Metri-Pack Bulkhead • 2×8 Matrix (A–S)", hasBanks: false },
  round_16:     { label: "Kostal LKS 1.5 • 16-Way Round Case Connector", hasBanks: false },
  round_20:     { label: "Delphi 12126459 • 20-Way Gray Round Trans Shell", hasBanks: false },
  grid_40:      { label: "OEM 13576552 Inline • 4×10 Factory Matrix", hasBanks: false },
  grid_50:      { label: "OEM 13505902 X50A Fuseblock • 5×10 Matrix", hasBanks: false },
  lt1_32:       { label: "OEM Micro-Pack 100W • 2×16 Factory Matrix", hasBanks: false },
  vcm_24:       { label: "OEM Micro-Pack 100W • 2×12 Factory Matrix", hasBanks: false }
};

const SHELL_THEMES = {
  blue:  { outer: "#1D4ED8", outerStroke: "#60A5FA", face: "#081226", bezel: "#1E3A8A", label: "#93C5FD" },
  red:   { outer: "#B91C1C", outerStroke: "#F87171", face: "#1F090C", bezel: "#7F1D1D", label: "#FCA5A5" },
  green: { outer: "#15803D", outerStroke: "#4ADE80", face: "#071C10", bezel: "#14532D", label: "#86EFAC" },
  black: { outer: "#27272A", outerStroke: "#71717A", face: "#09090B", bezel: "#18181B", label: "#A1A1AA" },
  gray:  { outer: "#475569", outerStroke: "#CBD5E1", face: "#0F172A", bezel: "#334155", label: "#E2E8F0" },
  clear: { outer: "#94A3B8", outerStroke: "#F8FAFC", face: "#0F172A", bezel: "#64748B", label: "#F1F5F9" }
};

const PIN_SVG_COLORS = {
  external: { fill: "#083344", stroke: "#22D3EE", text: "#ECFEFF" },
  keep:     { fill: "#052E16", stroke: "#34D399", text: "#ECFDF5" },
  repin:    { fill: "#4C0519", stroke: "#FB7185", text: "#FFF1F2" },
  trans:    { fill: "#2E1065", stroke: "#C084FC", text: "#F5F3FF" },
  remove:   { fill: "#451A03", stroke: "#FBBF24", text: "#FFFBEB" },
  empty:    { fill: "#14151A", stroke: "#27272A", text: "#52525B" }
};

function buildConnectorSVG(ecm, conn, opts) {
  // opts: { cfg, progressState, getPinKey, selectedPin, activeFilter, bankMode, onClickFnName }
  const theme = SHELL_THEMES[conn.color] || SHELL_THEMES.black;
  const lt = conn.layoutType || "pcm_80";
  const clickFn = opts.onClickFnName || "onConnectorPinTap";
  const bankMode = opts.bankMode || "full";
  const activeFilter = opts.activeFilter || "ALL";

  // Build pin lookup (prioritize non-empty or repin entry if duplicate option rows exist)
  const pinMap = {};
  const counts = { external: 0, keep: 0, repin: 0, trans: 0, remove: 0, empty: 0 };

  conn.pins.forEach((p, idx) => {
    const v = computeVerdictWithConfig(p, ecm, conn, opts.cfg);
    counts[v.status] = (counts[v.status] || 0) + 1;
    const k = String(p.pin);
    if (!pinMap[k] || (pinMap[k].verdict.status === "empty" && v.status !== "empty") || v.status === "repin") {
      pinMap[k] = { pinObj: p, verdict: v, idx: idx };
    }
  });

  function renderRectPin(pnum, x, y, w, h, optsPin = {}) {
    const k = String(pnum);
    const entry = pinMap[k];
    const st = entry ? entry.verdict.status : "empty";
    const pal = PIN_SVG_COLORS[st] || PIN_SVG_COLORS.empty;
    const pKey = entry ? opts.getPinKey(ecm.id, conn.id, pnum, entry.idx) : "";
    const isDone = pKey && opts.progressState[pKey] && opts.progressState[pKey].done;
    const isSel = String(opts.selectedPin) === k;
    const isDimmed = (activeFilter !== "ALL" && st !== activeFilter && !isSel);
    const rx = optsPin.rx || 4;
    const fontSize = optsPin.fontSize || (String(pnum).length > 4 ? 8.5 : String(pnum).length > 2 ? 9.5 : 10.5);
    const funcTip = entry ? `${conn.id} Pin ${pnum}: ${entry.pinObj.function} (${entry.pinObj.wire})` : `Pin ${pnum}: Empty / Not Used`;

    let opacity = isDone ? 0.36 : 1;
    if (isDimmed) opacity = 0.16;

    let extra = "";
    if (optsPin.bladeSlot) {
      // Realistic 2.8mm wide blade terminal slot graphic inside large power/ground cavity
      const bLbl = optsPin.bladeLabel || "2.8mm";
      extra += `<rect x="${x + w*0.22}" y="${y + h - 13}" width="${w*0.56}" height="5" rx="1.5" fill="${pal.stroke}" opacity="0.55"/>`;
      extra += `<text x="${x + w/2}" y="${y + 15}" text-anchor="middle" fill="${pal.text}" font-size="9" font-weight="700" opacity="0.78">${bLbl}</text>`;
    } else if (optsPin.heavyCavity) {
      extra += `<rect x="${x + 2.5}" y="${y + 2.5}" width="${w - 5}" height="${h - 5}" rx="${Math.max(2, rx - 1)}" fill="none" stroke="${pal.stroke}" stroke-opacity="0.55" stroke-width="1"/>`;
    }
    if (isDone) {
      extra += `<circle cx="${x + w - 5}" cy="${y + 5}" r="3.2" fill="#34D399"/>`;
    }
    const selRing = isSel
      ? `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="${rx + 2}" fill="none" stroke="#FFFFFF" stroke-width="2.4"/>`
      : "";

    const textY = optsPin.bladeSlot ? (y + h/2 + 4) : (y + h/2 + fontSize*0.36);
    const safeTip = funcTip.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

    return `<g class="svg-pin-node" style="cursor:pointer" opacity="${opacity}" onclick="${clickFn}('${k}')">
      <title>${safeTip}</title>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${pal.fill}" stroke="${pal.stroke}" stroke-width="${st === 'repin' ? 2 : 1.25}"/>
      ${extra}
      <text x="${x + w/2}" y="${textY}" text-anchor="middle" fill="${pal.text}" font-size="${optsPin.bladeSlot ? 14 : fontSize}" font-weight="800" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,sans-serif">${k}</text>
      ${selRing}
    </g>`;
  }

  function renderCirclePin(pnum, cx, cy, r, fontSize = 10.5) {
    const k = String(pnum);
    const entry = pinMap[k];
    const st = entry ? entry.verdict.status : "empty";
    const pal = PIN_SVG_COLORS[st] || PIN_SVG_COLORS.empty;
    const pKey = entry ? opts.getPinKey(ecm.id, conn.id, pnum, entry.idx) : "";
    const isDone = pKey && opts.progressState[pKey] && opts.progressState[pKey].done;
    const isSel = String(opts.selectedPin) === k;
    const isDimmed = (activeFilter !== "ALL" && st !== activeFilter && !isSel);
    let opacity = isDone ? 0.36 : 1;
    if (isDimmed) opacity = 0.16;
    const funcTip = entry ? `${conn.id} Pin ${pnum}: ${entry.pinObj.function} (${entry.pinObj.wire})` : `Cavity ${pnum}: Empty / Sealed`;
    const safeTip = funcTip.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

    return `<g class="svg-pin-node" style="cursor:pointer" opacity="${opacity}" onclick="${clickFn}('${k}')">
      <title>${safeTip}</title>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${pal.fill}" stroke="${pal.stroke}" stroke-width="${st === 'repin' ? 2.2 : 1.4}"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 3.5}" fill="none" stroke="${pal.stroke}" stroke-opacity="0.22" stroke-width="0.8"/>
      <text x="${cx}" y="${cy + fontSize*0.36}" text-anchor="middle" fill="${pal.text}" font-size="${fontSize}" font-weight="800" font-family="-apple-system,BlinkMacSystemFont,'SF Pro Text',Inter,sans-serif">${k}</text>
      ${isDone ? `<circle cx="${cx + r*0.62}" cy="${cy - r*0.62}" r="3.4" fill="#34D399"/>` : ""}
      ${isSel ? `<circle cx="${cx}" cy="${cy}" r="${r + 2.8}" fill="none" stroke="#FFFFFF" stroke-width="2.4"/>` : ""}
    </g>`;
  }

  function renderHexBolt(cx, cy, r = 18, label = "7mm") {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<g pointer-events="none">
      <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#090B10" stroke="${theme.outerStroke}" stroke-opacity="0.45" stroke-width="1.5"/>
      <polygon points="${pts.join(" ")}" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.52}" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
      <text x="${cx}" y="${cy + 3}" text-anchor="middle" fill="#CBD5E1" font-size="7.5" font-weight="800" font-family="sans-serif">${label}</text>
    </g>`;
  }

  let svgContent = "";
  let viewBox = "0 0 600 180";
  let isRound = false;

  // -------------------------------------------------------------------------
  // 1. PCM_80: Delphi Micro-Pack 100W 80-Way (2x40 split by 7mm Center Bolt)
  // -------------------------------------------------------------------------
  if (lt === "pcm_80") {
    const cw = 25, ch = 31, gx = 3, gy = 8;
    const leftX = 24, boltW = 58;
    const bankW = 20 * (cw + gx) - gx; // 557
    const rightX = leftX + bankW + boltW; // 639
    const W = rightX + bankW + 24; // 1220
    const topY = 34;
    const H = topY + ch * 2 + gy + 22; // 126
    const boltCx = leftX + bankW + boltW / 2;
    const boltCy = topY + ch + gy / 2;

    if (bankMode === "left") {
      viewBox = `0 0 ${leftX + bankW + boltW + 8} ${H}`;
    } else if (bankMode === "right") {
      const rx0 = leftX + bankW - 8;
      viewBox = `${rx0} 0 ${W - rx0} ${H}`;
    } else {
      viewBox = `0 0 ${W} ${H}`;
    }

    // Molded top latch + stadium shell
    svgContent += `
      <rect x="${boltCx - 48}" y="2" width="96" height="14" rx="4" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.4"/>
      <rect x="6" y="12" width="${W - 12}" height="${H - 18}" rx="24" fill="${theme.outer}" fill-opacity="0.28" stroke="${theme.outerStroke}" stroke-width="2.2"/>
      <rect x="13" y="19" width="${W - 26}" height="${H - 32}" rx="18" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.5"/>
      <text x="${leftX + 4}" y="29" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">PIN 1</text>
      <text x="${leftX + bankW - 4}" y="29" text-anchor="end" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">20</text>
      <text x="${rightX + 4}" y="29" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">21</text>
      <text x="${rightX + bankW - 4}" y="29" text-anchor="end" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">PIN 40</text>
      <text x="${leftX + 4}" y="${H - 10}" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">PIN 41</text>
      <text x="${leftX + bankW - 4}" y="${H - 10}" text-anchor="end" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">60</text>
      <text x="${rightX + 4}" y="${H - 10}" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">61</text>
      <text x="${rightX + bankW - 4}" y="${H - 10}" text-anchor="end" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">PIN 80</text>
    `;

    for (let c = 0; c < 20; c++) {
      svgContent += renderRectPin(1 + c, leftX + c * (cw + gx), topY, cw, ch);
      svgContent += renderRectPin(41 + c, leftX + c * (cw + gx), topY + ch + gy, cw, ch);
      svgContent += renderRectPin(21 + c, rightX + c * (cw + gx), topY, cw, ch);
      svgContent += renderRectPin(61 + c, rightX + c * (cw + gx), topY + ch + gy, cw, ch);
    }
    svgContent += renderHexBolt(boltCx, boltCy, 19, "7mm");
  }

  // -------------------------------------------------------------------------
  // 2. MX123_80: Molex MX123 80-Way (4 Rows x 20 Cavities)
  // -------------------------------------------------------------------------
  else if (lt === "mx123_80") {
    const cw = 26, ch = 27, gx = 3, gy = 5;
    const padX = 28, topY = 34;
    const gridW = 20 * (cw + gx) - gx; // 577
    const W = gridW + padX * 2; // 633
    const H = topY + 4 * ch + 3 * gy + 22; // 179
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <!-- Cam-lever pivot shrouds on left/right + polarization keys on top -->
      <rect x="4" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W - 16}" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="95" y="4" width="38" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="${W - 133}" y="4" width="38" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="14" y="12" width="${W - 28}" height="${H - 18}" rx="14" fill="${theme.outer}" fill-opacity="0.28" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="20" y="18" width="${W - 40}" height="${H - 30}" rx="10" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">61</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">MOLEX MX123 • 4×20 (80-WAY)</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">80</text>
      <text x="${padX}" y="${H - 10}" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${padX + gridW}" y="${H - 10}" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">20</text>
    `;
    // Mating face view matches MX123 73-way orientation: top row 61..80 down to bottom row 1..20
    const rowStarts80 = [61, 41, 21, 1];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 20; c++) {
        const pnum = rowStarts80[r] + c;
        svgContent += renderRectPin(pnum, padX + c * (cw + gx), topY + r * (ch + gy), cw, ch);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 3. MX123_73: Molex MX123 73-Way (72 x 0.64mm Micro + Large 2.8mm Pin 73)
  // -------------------------------------------------------------------------
  else if (lt === "mx123_73") {
    const cw = 26, ch = 27, gx = 3, gy = 5;
    const padX = 28, topY = 34;
    const gridW = 20 * (cw + gx) - gx; // 577
    const W = gridW + padX * 2; // 633
    const H = topY + 4 * ch + 3 * gy + 22; // 179
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="4" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W - 16}" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="95" y="4" width="38" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="${W - 133}" y="4" width="38" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="14" y="12" width="${W - 28}" height="${H - 18}" rx="14" fill="${theme.outer}" fill-opacity="0.28" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="20" y="18" width="${W - 40}" height="${H - 30}" rx="10" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">53</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">MOLEX MX123 • 73-WAY (PIN 73 POWER BLADE)</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">72</text>
      <text x="${padX}" y="${H - 10}" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${padX + 16*(cw+gx) - gx}" y="${H - 10}" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">16</text>
    `;
    // Top row: 53..72 (20 micro)
    for (let c = 0; c < 20; c++) {
      svgContent += renderRectPin(53 + c, padX + c * (cw + gx), topY, cw, ch);
    }
    // 2nd row: 33..52 (20 micro)
    for (let c = 0; c < 20; c++) {
      svgContent += renderRectPin(33 + c, padX + c * (cw + gx), topY + (ch + gy), cw, ch);
    }
    // 3rd row: 17..32 (16 micro)
    for (let c = 0; c < 16; c++) {
      svgContent += renderRectPin(17 + c, padX + c * (cw + gx), topY + 2 * (ch + gy), cw, ch);
    }
    // Bottom row: 1..16 (16 micro)
    for (let c = 0; c < 16; c++) {
      svgContent += renderRectPin(1 + c, padX + c * (cw + gx), topY + 3 * (ch + gy), cw, ch);
    }
    // Large 2.8mm Power Blade Cavity 73 occupying right 4 cols x bottom 2 rows
    const p73X = padX + 16 * (cw + gx) + 4;
    const p73Y = topY + 2 * (ch + gy);
    const p73W = 4 * (cw + gx) - gx - 4;
    const p73H = 2 * ch + gy;
    svgContent += renderRectPin(73, p73X, p73Y, p73W, p73H, { rx: 6, bladeSlot: true });
  }

  // -------------------------------------------------------------------------
  // 4. MX123_56: Molex MX123 56-Way (4 Rows x 14 Cavities)
  // -------------------------------------------------------------------------
  else if (lt === "mx123_56") {
    const cw = 28, ch = 28, gx = 4, gy = 5;
    const padX = 28, topY = 34;
    const gridW = 14 * (cw + gx) - gx; // 444
    const W = gridW + padX * 2; // 500
    const H = topY + 4 * ch + 3 * gy + 22; // 183
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="4" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W - 16}" y="42" width="12" height="${H - 68}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W/2 - 32}" y="4" width="64" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="14" y="12" width="${W - 28}" height="${H - 18}" rx="14" fill="${theme.outer}" fill-opacity="0.28" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="20" y="18" width="${W - 40}" height="${H - 30}" rx="10" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">43</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">MOLEX MX123 • 4×14 (56-WAY)</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">56</text>
      <text x="${padX}" y="${H - 10}" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${padX + gridW}" y="${H - 10}" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">14</text>
    `;
    const rowStarts56 = [43, 29, 15, 1];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        svgContent += renderRectPin(rowStarts56[r] + c, padX + c * (cw + gx), topY + r * (ch + gy), cw, ch);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4b. T42_49: Aptiv 15463921 / GM 88987979 49-Way Sealed Hybrid TCM Connector
  //     (3 Rows x 16 Micro-64 [1..48] + 1 Large GT 280 2.8mm Blade [Pin 49])
  // -------------------------------------------------------------------------
  else if (lt === "t42_49") {
    const cw = 26, ch = 28, gx = 3, gy = 6;
    const padX = 28, topY = 34;
    const microW = 16 * (cw + gx) - gx; // 461
    const bladeGap = 8, bladeW = 68;
    const totalInnerW = microW + bladeGap + bladeW; // 537
    const W = totalInnerW + padX * 2; // 593
    const H = topY + 3 * ch + 2 * gy + 22; // 152
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="4" y="36" width="12" height="${H - 58}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W - 16}" y="36" width="12" height="${H - 58}" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="${W/2 - 38}" y="4" width="76" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.2"/>
      <rect x="14" y="12" width="${W - 28}" height="${H - 18}" rx="14" fill="${theme.outer}" fill-opacity="0.28" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="20" y="18" width="${W - 40}" height="${H - 30}" rx="10" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">33</text>
      <text x="${W/2 - 14}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">APTIV 15463921 • 49-WAY HYBRID (3×16 + GT 280)</text>
      <text x="${padX + microW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">48</text>
      <text x="${padX}" y="${H - 9}" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${padX + microW}" y="${H - 9}" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">16</text>
    `;
    const rowStarts49 = [33, 17, 1];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 16; c++) {
        svgContent += renderRectPin(rowStarts49[r] + c, padX + c * (cw + gx), topY + r * (ch + gy), cw, ch);
      }
    }
    // Pin 49 GT 280 (2.8mm) Main Ground Cavity on right bay
    const p49X = padX + microW + bladeGap;
    const p49Y = topY + Math.round((3 * ch + 2 * gy - 68) / 2);
    svgContent += renderRectPin(49, p49X, p49Y, bladeW, 68, { rx: 6, bladeSlot: true, bladeLabel: "GT 280" });
  }

  // -------------------------------------------------------------------------
  // 5. FUSEBLOCK_C2: GM Underhood Fuseblock C2 (6 Rows A..F x 12 Cols 1..12)
  // -------------------------------------------------------------------------
  else if (lt === "fuseblock_c2") {
    const rows = ["A", "B", "C", "D", "E", "F"];
    const cw = 34, ch = 28, gx = 4, gy = 4;
    const padL = 34, padR = 20, topY = 34;
    const gridW = 12 * (cw + gx) - gx; // 452
    const W = padL + gridW + padR; // 506
    const H = topY + 6 * (ch + gy) - gy + 18; // 240
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="6" y="8" width="${W - 12}" height="${H - 14}" rx="12" fill="${theme.outer}" fill-opacity="0.3" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="12" y="14" width="${W - 24}" height="${H - 26}" rx="8" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
    `;
    // Column headers 1..12
    for (let c = 0; c < 12; c++) {
      svgContent += `<text x="${padL + c * (cw + gx) + cw / 2}" y="27" text-anchor="middle" fill="${theme.label}" font-size="9" font-weight="800" font-family="sans-serif">${c + 1}</text>`;
    }
    // Row headers A..F
    for (let r = 0; r < 6; r++) {
      svgContent += `<text x="23" y="${topY + r * (ch + gy) + ch / 2 + 3.5}" text-anchor="middle" fill="${theme.label}" font-size="10" font-weight="800" font-family="sans-serif">${rows[r]}</text>`;
    }

    const occupied = Array.from({ length: 6 }, () => Array(13).fill(false));
    const uniquePinIds = [];
    conn.pins.forEach(p => {
      const k = String(p.pin);
      if (!uniquePinIds.includes(k)) uniquePinIds.push(k);
    });

    uniquePinIds.forEach(k => {
      const m = k.match(/^([A-F])(\d+)(?:-[A-F]?(\d+))?$/i);
      if (m) {
        const r = rows.indexOf(m[1].toUpperCase());
        const c1 = parseInt(m[2], 10);
        const c2 = m[3] ? parseInt(m[3], 10) : c1;
        if (r >= 0 && c1 >= 1 && c2 <= 12) {
          for (let c = c1; c <= c2; c++) occupied[r][c] = true;
          const x = padL + (c1 - 1) * (cw + gx);
          const y = topY + r * (ch + gy);
          const spanW = (c2 - c1 + 1) * (cw + gx) - gx;
          svgContent += renderRectPin(k, x, y, spanW, ch, { fontSize: k.length > 4 ? 8.5 : 9.5 });
        }
      }
    });

    // Render center bolt at D6-D7 if vacant (2004+), otherwise subtle center bolt marker + empty cells
    const boltAtD6D7 = !occupied[3][6] && !occupied[3][7];
    for (let r = 0; r < 6; r++) {
      for (let c = 1; c <= 12; c++) {
        if (!occupied[r][c]) {
          if (boltAtD6D7 && r === 3 && (c === 6 || c === 7)) continue;
          const k = `${rows[r]}${c}`;
          svgContent += renderRectPin(k, padL + (c - 1) * (cw + gx), topY + r * (ch + gy), cw, ch);
        }
      }
    }
    if (boltAtD6D7) {
      const bx = padL + 5 * (cw + gx) + cw + gx / 2;
      const by = topY + 3 * (ch + gy) + ch / 2;
      svgContent += renderHexBolt(bx, by, 13, "7mm");
    } else {
      const bx = padL + 6 * (cw + gx) - gx / 2;
      const by = topY + 3 * (ch + gy) - gy / 2;
      svgContent += `<circle cx="${bx}" cy="${by}" r="7" fill="#1E293B" stroke="#94A3B8" stroke-width="1.4" pointer-events="none"/>
                     <circle cx="${bx}" cy="${by}" r="2.8" fill="#94A3B8" pointer-events="none"/>`;
    }
  }

  // -------------------------------------------------------------------------
  // 6. C100_16: Vortec C100 Firewall Bulkhead (2 Rows x 8 Cavities: A..H, J..S)
  // -------------------------------------------------------------------------
  else if (lt === "c100_16") {
    const r0 = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const r1 = ["J", "K", "L", "M", "N", "P", "R", "S"];
    const cw = 36, ch = 33, gx = 5, gy = 8;
    const padX = 24, topY = 34;
    const gridW = 8 * (cw + gx) - gx; // 323
    const W = gridW + padX * 2; // 371
    const H = topY + 2 * ch + gy + 20; // 128
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="${W/2 - 34}" y="3" width="68" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="10" y="12" width="${W - 20}" height="${H - 18}" rx="12" fill="${theme.outer}" fill-opacity="0.3" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="16" y="18" width="${W - 32}" height="${H - 30}" rx="8" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">C100 BULKHEAD • 2×8 (A–S)</text>
    `;
    r0.forEach((lbl, c) => { svgContent += renderRectPin(lbl, padX + c * (cw + gx), topY, cw, ch, { fontSize: 11.5 }); });
    r1.forEach((lbl, c) => { svgContent += renderRectPin(lbl, padX + c * (cw + gx), topY + ch + gy, cw, ch, { fontSize: 11.5 }); });
  }

  // -------------------------------------------------------------------------
  // 7. ROUND_16: 6L80E / 6L90E Kostal 16-Way Round Bulkhead (12 Outer + 4 Inner)
  // -------------------------------------------------------------------------
  else if (lt === "round_16") {
    isRound = true;
    const W = 310, H = 316, cx = 155, cy = 162;
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <!-- Top alignment key lug & bayonet twist ears -->
      <rect x="${cx - 16}" y="8" width="32" height="22" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.8"/>
      <circle cx="${cx - 118}" cy="${cy + 58}" r="12" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.5"/>
      <circle cx="${cx + 118}" cy="${cy + 58}" r="12" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.5"/>
      <!-- Outer round Kostal shell -->
      <circle cx="${cx}" cy="${cy}" r="134" fill="${theme.outer}" fill-opacity="0.32" stroke="${theme.outerStroke}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="121" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="2"/>
      <!-- Inner keyway notch at 12 o'clock -->
      <path d="M ${cx - 10} ${cy - 121} L ${cx - 10} ${cy - 110} L ${cx + 10} ${cy - 110} L ${cx + 10} ${cy - 121}" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <circle cx="${cx}" cy="${cy}" r="63" fill="none" stroke="${theme.bezel}" stroke-dasharray="4 3" stroke-width="1.2"/>
    `;
    // Outer ring: Pins 1..12 clockwise around perimeter flanking 12 o'clock keyway
    for (let i = 0; i < 12; i++) {
      const deg = -75 + i * 30;
      const rad = (deg * Math.PI) / 180;
      const px = cx + 91 * Math.cos(rad);
      const py = cy + 91 * Math.sin(rad);
      svgContent += renderCirclePin(i + 1, px, py, 16, 10.5);
    }
    // Inner ring: Pins 13..16
    const innerAngles = [-45, 45, 135, -135];
    innerAngles.forEach((deg, idx) => {
      const rad = (deg * Math.PI) / 180;
      const px = cx + 36 * Math.cos(rad);
      const py = cy + 36 * Math.sin(rad);
      svgContent += renderCirclePin(13 + idx, px, py, 16, 10.5);
    });
  }

  // -------------------------------------------------------------------------
  // 8. ROUND_20: 4L60E / 4L80E Delphi 20-Way Gray Round Shell (4-6-6-4 Matrix)
  // -------------------------------------------------------------------------
  else if (lt === "round_20") {
    isRound = true;
    const W = 316, H = 322, cx = 158, cy = 165;
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <!-- Top alignment latch & side release tabs -->
      <rect x="${cx - 20}" y="8" width="40" height="22" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.8"/>
      <rect x="8" y="${cy - 22}" width="16" height="44" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.5"/>
      <rect x="${W - 24}" y="${cy - 22}" width="16" height="44" rx="5" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.5"/>
      <!-- Gray circular transmission connector body -->
      <circle cx="${cx}" cy="${cy}" r="136" fill="${theme.outer}" fill-opacity="0.34" stroke="${theme.outerStroke}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="122" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="2"/>
      <!-- 12 o'clock alignment index rib -->
      <rect x="${cx - 8}" y="${cy - 122}" width="16" height="10" rx="2" fill="${theme.outerStroke}" opacity="0.65"/>
    `;
    const chordRows = [
      { y: cy - 72, sp: 36, pins: ["A", "B", "C", "D"] },
      { y: cy - 24, sp: 35, pins: ["E", "F", "G", "H", "J", "K"] },
      { y: cy + 24, sp: 35, pins: ["L", "M", "N", "P", "R", "S"] },
      { y: cy + 72, sp: 36, pins: ["T", "U", "V", "W"] }
    ];
    chordRows.forEach(row => {
      const startX = cx - ((row.pins.length - 1) * row.sp) / 2;
      row.pins.forEach((lbl, idx) => {
        svgContent += renderCirclePin(lbl, startX + idx * row.sp, row.y, 15.2, 10.5);
      });
    });
  }

  // -------------------------------------------------------------------------
  // 9. GRID_40: 2010 Camaro X102 Inline Connector (4 Rows x 10 Cavities)
  // -------------------------------------------------------------------------
  else if (lt === "grid_40") {
    const cw = 34, ch = 28, gx = 4, gy = 5;
    const padX = 24, topY = 34;
    const gridW = 10 * (cw + gx) - gx; // 376
    const W = gridW + padX * 2; // 424
    const H = topY + 4 * ch + 3 * gy + 20; // 181
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="${W/2 - 36}" y="3" width="72" height="12" rx="3" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.3"/>
      <rect x="10" y="12" width="${W - 20}" height="${H - 18}" rx="12" fill="${theme.outer}" fill-opacity="0.3" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="16" y="18" width="${W - 32}" height="${H - 30}" rx="8" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">X102 INLINE • 4×10 (40-WAY)</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">10</text>
    `;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        svgContent += renderRectPin(r * 10 + c + 1, padX + c * (cw + gx), topY + r * (ch + gy), cw, ch);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 10. GRID_50: 2010 Camaro X50A / Underhood X3 (5 Rows x 10 Cavities)
  // -------------------------------------------------------------------------
  else if (lt === "grid_50") {
    const cw = 34, ch = 27, gx = 4, gy = 5;
    const padX = 24, topY = 34;
    const gridW = 10 * (cw + gx) - gx; // 376
    const W = gridW + padX * 2; // 424
    const H = topY + 5 * ch + 4 * gy + 20; // 209
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="10" y="10" width="${W - 20}" height="${H - 16}" rx="12" fill="${theme.outer}" fill-opacity="0.3" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="16" y="16" width="${W - 32}" height="${H - 28}" rx="8" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">X50A FUSEBLOCK X3 • 5×10 (50-WAY)</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">10</text>
    `;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 10; c++) {
        const pnum = r * 10 + c + 1;
        svgContent += renderRectPin(pnum, padX + c * (cw + gx), topY + r * (ch + gy), cw, ch, { heavyCavity: pnum === 4 });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 11 & 12. LT1_32 (2x16) & VCM_24 (2x12): Delphi Micro-Pack 100W Classic PCMs
  // -------------------------------------------------------------------------
  else {
    const cols = (lt === "vcm_24" || conn.pinCount === 24) ? 12 : 16;
    const cw = cols === 12 ? 32 : 28;
    const ch = 31, gx = 4, gy = 8;
    const padX = 22, topY = 34;
    const gridW = cols * (cw + gx) - gx;
    const W = gridW + padX * 2;
    const H = topY + 2 * ch + gy + 20;
    viewBox = `0 0 ${W} ${H}`;

    svgContent += `
      <rect x="${W/2 - 40}" y="3" width="80" height="12" rx="4" fill="${theme.outer}" stroke="${theme.outerStroke}" stroke-width="1.4"/>
      <rect x="8" y="12" width="${W - 16}" height="${H - 18}" rx="16" fill="${theme.outer}" fill-opacity="0.3" stroke="${theme.outerStroke}" stroke-width="2"/>
      <rect x="14" y="18" width="${W - 28}" height="${H - 30}" rx="11" fill="${theme.face}" stroke="${theme.bezel}" stroke-width="1.4"/>
      <text x="${padX}" y="29" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">1</text>
      <text x="${W/2}" y="29" text-anchor="middle" fill="${theme.label}" font-size="8.5" font-weight="700" opacity="0.8" font-family="sans-serif">MICRO-PACK 100W • 2×${cols}</text>
      <text x="${padX + gridW}" y="29" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">${cols}</text>
      <text x="${padX}" y="${H - 9}" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">${cols + 1}</text>
      <text x="${padX + gridW}" y="${H - 9}" text-anchor="end" fill="${theme.label}" font-size="8.5" font-weight="800" font-family="sans-serif">${cols * 2}</text>
    `;
    for (let c = 0; c < cols; c++) {
      svgContent += renderRectPin(1 + c, padX + c * (cw + gx), topY, cw, ch);
      svgContent += renderRectPin(cols + 1 + c, padX + c * (cw + gx), topY + ch + gy, cw, ch);
    }
  }

  const svgStyle = isRound
    ? "width:100%;max-width:265px;height:auto;display:block;margin:0 auto;"
    : "width:100%;height:auto;display:block;";

  return {
    svg: `<svg viewBox="${viewBox}" style="${svgStyle}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`,
    counts,
    meta: CONNECTOR_LAYOUT_META[lt] || { label: "OEM Factory Connector Face", hasBanks: false }
  };
}
