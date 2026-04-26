#!/usr/bin/env python3
"""Map user-provided t1--t14 and PHOTO assets to partners/logos/{key}.png"""
import os
import re
import shutil

ASSETS = "/Users/champions/.cursor/projects/Users-champions-StudioProjects-nanofusion/assets"
OUT = os.path.join(
    os.path.dirname(__file__),
    "..",
    "assets",
    "partners",
    "logos",
)
OUT = os.path.normpath(OUT)
BACKUP = os.path.join(OUT, "backup_before_user_logos")
os.makedirs(BACKUP, exist_ok=True)

KEYS = [
    "ars",
    "uiaf",
    "iso_cert",
    "iso14001",
    "iso_gold",
    "sipchem",
    "maaden",
    "schem",
    "satorp",
    "aramco",
    "rawabi",
    "kayan",
    "sadara",
    "stc",
    "sabic",
    "halliburton",
    "alasala",
    "ibnsina",
    "slb",
    "madaris",
    "yansab",
    "sasref",
    "nesma",
    "walaplus",
    "advanced",
    "org5",
    "safco",
    "kfupm",
    "org6",
    "org7",
    "imam",
    "org8",
    "tvtc",
    "sec",
]


def t_sort_key(name: str):
    m = re.match(r"t(\d+)-", name, re.I)
    return int(m.group(1)) if m else 999


def main():
    t_files = [f for f in os.listdir(ASSETS) if re.match(r"t\d+-.+\.png$", f, re.I)]
    t_files.sort(key=t_sort_key)
    if len(t_files) != 14:
        raise SystemExit(f"expected 14 t-*.png files, got {len(t_files)}: {t_files}")

    photo_files = [
        f
        for f in os.listdir(ASSETS)
        if f.startswith("PHOTO-2026-04-27-01-46")
        or f.startswith("PHOTO-2026-04-27-01-47")
    ]
    photo_files.sort()
    if len(photo_files) != 19:
        raise SystemExit(f"expected 19 PHOTO files, got {len(photo_files)}")

    for f in list(os.listdir(OUT)):
        if f.endswith((".png", ".svg", ".jpg")) and not f.startswith("."):
            src = os.path.join(OUT, f)
            if os.path.isfile(src):
                shutil.copy2(src, os.path.join(BACKUP, f))
    print(f"Backed up previous logos to {BACKUP}\n")

    for i in range(14):
        src = os.path.join(ASSETS, t_files[i])
        dst = os.path.join(OUT, KEYS[i] + ".png")
        shutil.copy2(src, dst)
        print(f"  {KEYS[i]:12} <- {t_files[i]}")

    for i in range(19):
        src = os.path.join(ASSETS, photo_files[i])
        dst = os.path.join(OUT, KEYS[14 + i] + ".png")
        shutil.copy2(src, dst)
        print(f"  {KEYS[14 + i]:12} <- {photo_files[i]}")

    # sec: keep pre-downloaded official if present in backup
    old_sec = os.path.join(BACKUP, "sec.png")
    if os.path.exists(old_sec) and os.path.getsize(old_sec) > 5000:
        shutil.copy2(old_sec, os.path.join(OUT, "sec.png"))
        print("  sec          <- (restored from backup, official SEC)")

    # remove stale svg so HTML prefers png
    for f in os.listdir(OUT):
        if f.endswith(".svg") and os.path.isfile(os.path.join(OUT, f)):
            os.remove(os.path.join(OUT, f))
            print(f"  removed {f}")


if __name__ == "__main__":
    main()
    print("\nDone.")
