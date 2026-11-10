# LS / LT Swap Interactive ECM Pinout & Standalone Harness Master (v2.1)

A 100% self-contained, offline standalone application containing **2,537 circuit pinout entries** across **45 factory OEM-shaped connectors** and **12 major GM ECM / PCM / TCM families** sourced from `lt1swap.com` and GM / Aptiv / Molex / Kostal factory service specifications.

## How to Launch / Install
- **Android APK (v2.1.0 — Exact OEM Connector Edition):** Install **`LS_Pinout_Pro_iOS_Dark.apk`** directly on any Android phone or tablet (Android 7.0+ / API 24–34, signed with v1/v2/v3 APK Signature Schemes). Works 100% offline in the shop with exact vector OEM connector housings, bank zoom on wide 80-pin plugs, plain-English filter chips, haptic feedback, native share export, and persistent wire check-offs.
- **Mobile UI Preview on Desktop:** Open **`LS_Swap_iOS_Mobile_Preview.html`** in any browser to test or use the mobile experience directly on your computer.
- **Standalone Desktop Window:** Double-click **`Launch_LS_Pinout_Master.bat`** to open the full desktop workbench in its own dedicated application window.
- **Direct Portable Desktop File:** Double-click **`LS_Swap_Pinout_Master.html`** in any browser.
- **Android Source Project:** **`android_app/`** contains the full Android Studio / SDK source project (`com.lt1swap.pinoutmaster`).
- **Modular Web & SVG Engine Sources:** **`src/`** contains the modular OEM connector SVG engine (`shared_engine.js`) and UI templates (`mobile_template.html`, `desktop_template.html`), compiled via **`build.py`**.
- **Raw JSON Database:** **`pinout_data.json`** contains the complete structured JSON dataset of all 12 ECM families and 45 connectors with explicit OEM `layoutType` definitions (`pcm_80`, `mx123_80`, `mx123_73`, `mx123_56`, `t42_49`, `fuseblock_c2`, `c100_16`, `round_16`, `round_20`, `grid_40`, `grid_50`, `lt1_32`, `vcm_24`).

## Included ECM / PCM / TCM Families (45 Connectors)
1. **1999–2002 Gen III Vortec Truck (4.8 / 5.3 / 6.0) — P01 / "0411" PCM** (`09354896` / `12200411`, C1 Blue 2×40 & C2 Red 2×40 + 1999 & 2001 Underhood Fuseblock C2 6×12 & C100 2×8)
2. **2003–2007 Gen III Vortec Truck / SUV / Van (4.8 / 5.3 / 6.0) — P59 PCM** (`12576106` / `12586242` / `12589462` / `12589463`, C1 Blue 2×40 & C2 Green 2×40 + 2003, 2004 & 2006 Underhood Fuseblock C2 6×12 & C100 2×8)
3. **1999–2002 Gen III LS1 Camaro / Firebird (F-Body) & C5 Corvette — P01 / "0411" PCM** (C1 Blue 2×40 & C2 Red 2×40)
4. **1997–1998 Gen III LS1 Camaro / Firebird & C5 Corvette — Early "98" PCM** (`16238212`, C1 Red 2×40 & C2 Blue 2×40)
5. **2004 Pontiac GTO 5.7L LS1 — P59 PCM** (`12586243`, C1 Blue 2×40 & C2 Green 2×40)
6. **2007–2013 Gen IV Vortec Truck / SUV (4.8 / 5.3 / 6.0 / 6.2) — E38 ECM** (X1 Black 73-Pin Molex MX123 + X2 Gray 4×20 80-Pin Molex MX123)
7. **2010–2015 Camaro SS (LS3 / L99 6.2L) — E38 ECM** (X1 Black 73-Pin MX123, X2 Gray 4×20 80-Pin MX123, X102 Inline 4×10 40-Pin, & X50A Underhood X3 5×10 50-Pin)
8. **2005–2006 Gen IV LS2 / LH6 (Corvette, GTO, TBSS, SSR) — E40 ECM** (C1 Blue 4×14 56-Pin, C2 Black 73-Pin MX123, C3 Gray 4×14 56-Pin)
9. **2007–2015 Gen IV CTS-V LSA / TBSS / GMPP Crate — E67 ECM** (C1 Blue 4×14 56-Pin, C2 Black 73-Pin MX123, C3 Gray 73-Pin MX123)
10. **2014–2018 Gen V LT Direct Injection (L83 / L86 / LT1 / LT4) — E92 ECM** (X1 Blue 73-Pin MX123, X2 Black 73-Pin MX123, X3 Gray 73-Pin MX123)
11. **Transmission Controllers & Connectors** (T42 4-Speed 49-Pin Hybrid TCM `15463921`, 6L80E/6L90E T43 Kostal 16-Pin Round Connector, & 4L60E/4L80E Delphi 20-Pin Gray Round Connector)
12. **Classic GM Swaps** (1994–1997 Gen II LT1 4×32-Pin PCM & 1996–2000 L31 5.7L Vortec Blackbox VCM 3×32 + 1×24)
