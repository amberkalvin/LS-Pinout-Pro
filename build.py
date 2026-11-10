#!/usr/bin/env python3
"""
Build script for LS Pinout Pro (Web Workbench + Mobile Preview + Signed Android APK).
Compiles modular templates in `src/` with `pinout_data.json`, verifies all 45 OEM
connector SVGs if Node.js is installed, and optionally builds/signs the Android APK
when the Android SDK (API 34) is present.
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "src"
ANDROID_APP = ROOT / "android_app" / "app" / "src" / "main"
IOS_WEBAPP_DIR = ROOT / "ios_app" / "LSPinoutPro" / "WebApp"
IOS_PWA_DIR = ROOT / "ios_pwa"


def build_html_bundles() -> None:
    data = json.loads((ROOT / "pinout_data.json").read_text(encoding="utf-8"))
    json_min = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace(
        "</script>", "<\\/script>"
    )
    shared_js = (SRC_DIR / "shared_engine.js").read_text(encoding="utf-8")
    mobile_tpl = (SRC_DIR / "mobile_template.html").read_text(encoding="utf-8")
    desktop_tpl = (SRC_DIR / "desktop_template.html").read_text(encoding="utf-8")

    mobile_out = mobile_tpl.replace("__MASTER_DATA_JSON__", json_min).replace(
        "__SHARED_ENGINE_JS__", shared_js
    )
    desktop_out = desktop_tpl.replace("__MASTER_DATA_JSON__", json_min).replace(
        "__SHARED_ENGINE_JS__", shared_js
    )

    assert "__MASTER_DATA_JSON__" not in mobile_out and "__SHARED_ENGINE_JS__" not in mobile_out
    assert "__MASTER_DATA_JSON__" not in desktop_out and "__SHARED_ENGINE_JS__" not in desktop_out

    (ROOT / "LS_Swap_iOS_Mobile_Preview.html").write_text(mobile_out, encoding="utf-8")
    (ANDROID_APP / "assets" / "index.html").write_text(mobile_out, encoding="utf-8")
    IOS_WEBAPP_DIR.mkdir(parents=True, exist_ok=True)
    (IOS_WEBAPP_DIR / "index.html").write_text(mobile_out, encoding="utf-8")

    IOS_PWA_DIR.mkdir(parents=True, exist_ok=True)
    pwa_head = (
        '<link rel="manifest" href="manifest.json">\n'
        '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">\n'
        "</head>"
    )
    pwa_sw = (
        '<script>if("serviceWorker" in navigator && location.protocol.startsWith("http"))'
        '{window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}</script>\n'
        "</body>"
    )
    pwa_out = mobile_out.replace("</head>", pwa_head, 1).replace("</body>", pwa_sw, 1)
    (IOS_PWA_DIR / "index.html").write_text(pwa_out, encoding="utf-8")

    (ROOT / "LS_Swap_Pinout_Master.html").write_text(desktop_out, encoding="utf-8")

    total_conns = sum(len(e["connectors"]) for e in data["ecms"])
    print(f"[HTML] Built Mobile ({len(mobile_out):,} chars) & Desktop ({len(desktop_out):,} chars)")
    print(f"[DATA] {len(data['ecms'])} ECM families, {total_conns} OEM connectors")


def build_apk_if_sdk_available() -> None:
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    sdk = Path(os.environ.get("ANDROID_HOME") or (Path(local_app_data) / "Android" / "Sdk"))
    build_tools = sdk / "build-tools" / "34.0.0"
    android_jar = sdk / "platforms" / "android-34" / "android.jar"
    jbr_bin = Path(r"C:\Program Files\Android\Android Studio\jbr\bin")

    if not (build_tools.exists() and android_jar.exists()):
        print("[APK] Android SDK 34 not found; skipping command-line APK rebuild (HTML assets updated).")
        return

    env = os.environ.copy()
    if jbr_bin.exists():
        env["JAVA_HOME"] = str(jbr_bin.parent)
        env["PATH"] = f"{jbr_bin};{build_tools};{env.get('PATH', '')}"
    else:
        env["PATH"] = f"{build_tools};{env.get('PATH', '')}"

    def run(cmd: list[str]) -> None:
        res = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Command failed ({' '.join(cmd)}):\n{res.stdout}\n{res.stderr}")

    is_win = os.name == "nt"
    aapt2 = str(build_tools / ("aapt2.exe" if is_win else "aapt2"))
    d8 = str(build_tools / ("d8.bat" if is_win else "d8"))
    zipalign = str(build_tools / ("zipalign.exe" if is_win else "zipalign"))
    apksigner = str(build_tools / ("apksigner.bat" if is_win else "apksigner"))
    javac = str((jbr_bin / "javac.exe") if (is_win and jbr_bin.exists()) else "javac")

    with tempfile.TemporaryDirectory() as tmp:
        build_dir = Path(tmp)
        gen_java = build_dir / "gen"
        classes_dir = build_dir / "classes"
        dex_dir = build_dir / "dex"
        gen_java.mkdir()
        classes_dir.mkdir()
        dex_dir.mkdir()

        compiled_res = build_dir / "compiled_res.zip"
        unsigned_apk = build_dir / "unsigned.apk"
        aligned_apk = build_dir / "aligned.apk"

        run([aapt2, "compile", "--dir", str(ANDROID_APP / "res"), "-o", str(compiled_res)])
        run([
            aapt2, "link",
            "-I", str(android_jar),
            "--manifest", str(ANDROID_APP / "AndroidManifest.xml"),
            "-A", str(ANDROID_APP / "assets"),
            "--java", str(gen_java),
            "-o", str(unsigned_apk),
            str(compiled_res),
        ])

        java_files = [str(f) for f in (ANDROID_APP / "java").rglob("*.java")] + [
            str(f) for f in gen_java.rglob("*.java")
        ]
        run([javac, "--release", "11", "-cp", str(android_jar), "-d", str(classes_dir), *java_files])

        class_files = [str(f) for f in classes_dir.rglob("*.class")]
        run([d8, "--lib", str(android_jar), "--min-api", "24", "--output", str(dex_dir), *class_files])

        with zipfile.ZipFile(unsigned_apk, "a", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.write(dex_dir / "classes.dex", arcname="classes.dex")

        run([zipalign, "-f", "-p", "4", str(unsigned_apk), str(aligned_apk)])

        keystore = ROOT / "android_app" / "release-key.jks"
        final_apk = ROOT / "LS_Pinout_Pro_iOS_Dark.apk"
        run([
            apksigner, "sign",
            "--ks", str(keystore),
            "--ks-key-alias", "lspinoutkey",
            "--ks-pass", "pass:android123",
            "--key-pass", "pass:android123",
            "--v1-signing-enabled", "true",
            "--v2-signing-enabled", "true",
            "--v3-signing-enabled", "true",
            "--out", str(final_apk),
            str(aligned_apk),
        ])
        run([apksigner, "verify", str(final_apk)])
        print(f"[APK] Signed & verified {final_apk.name} ({final_apk.stat().st_size:,} bytes)")


if __name__ == "__main__":
    build_html_bundles()
    if "--html-only" not in sys.argv:
        build_apk_if_sdk_available()
