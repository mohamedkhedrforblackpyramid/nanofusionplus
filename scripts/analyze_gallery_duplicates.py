#!/usr/bin/env python3
"""Scan gallery images for exact and near-duplicates (aHash + dHash + small-thumb MSE)."""
from __future__ import annotations

import hashlib
import math
import sys
from pathlib import Path
from typing import NamedTuple

from PIL import Image, ImageOps

GALLERY_ROOT = Path(__file__).resolve().parents[1] / "web" / "marketing" / "assets" / "gallery"
EXT = {".png", ".jpg", ".jpeg", ".webp"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ahash_bits(im: Image.Image) -> int:
    g = im.convert("L").resize((8, 8), Image.Resampling.LANCZOS)
    px = list(g.getdata())
    avg = sum(px) / len(px)
    return sum(1 << i for i, v in enumerate(px) if v > avg)


def dhash_bits(im: Image.Image) -> int:
    g = im.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    bits = 0
    bit_i = 0
    for y in range(8):
        for x in range(8):
            if g.getpixel((x, y)) > g.getpixel((x + 1, y)):
                bits |= 1 << bit_i
            bit_i += 1
    return bits


def hamming64(a: int, b: int) -> int:
    return bin((a ^ b) & ((1 << 64) - 1)).count("1")


def load_image(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def main() -> int:
    root = GALLERY_ROOT
    if not root.is_dir():
        print(f"Missing gallery root: {root}", file=sys.stderr)
        return 1

    paths = sorted(
        p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in EXT and p.stat().st_size > 100
    )
    rel = lambda p: str(p.relative_to(root))

    # --- exact duplicates by SHA-256 ---
    by_sha: dict[str, list[Path]] = {}
    for p in paths:
        by_sha.setdefault(sha256_file(p), []).append(p)

    print("=== 1) مطابقة كاملة للملف (SHA-256) ===\n")
    exact_groups = [v for v in by_sha.values() if len(v) > 1]
    if not exact_groups:
        print("لا توجد صور متطابقة بايت-بايت.\n")
    else:
        for g in exact_groups:
            print("نسخ متطابقة:")
            for p in g:
                print(f"  - {rel(p)}")
            print()

    # Precompute RGB, hashes, and 48px equalized gray thumb (one load per file)
    class Entry(NamedTuple):
        w: int
        h: int
        ah: int
        dh: int
        thumb_eq: list[int]

    entries: dict[Path, Entry] = {}
    for p in paths:
        try:
            im = load_image(p)
            teq = ImageOps.equalize(im.convert("L")).resize(
                (48, 48), Image.Resampling.LANCZOS
            )
            teq_data = list(teq.getdata())
            entries[p] = Entry(
                w=im.size[0],
                h=im.size[1],
                ah=ahash_bits(im),
                dh=dhash_bits(im),
                thumb_eq=teq_data,
            )
        except OSError as e:
            print(f"SKIP {rel(p)}: {e}", file=sys.stderr)

    paths_ok = [p for p in paths if p in entries]

    def mse_from_thumbs(ta: list[int], tb: list[int]) -> float:
        return sum((x - y) ** 2 for x, y in zip(ta, tb)) / len(ta)

    # Near-duplicate pairs (hash + equalized-thumb MSE).
    # MSE cap avoids false positives when many photos share the same showroom look (dark wall + tiles).
    STRICT_A, STRICT_D = 8, 12
    STRONG_MSE = 55.0  # same file / re-export / WhatsApp recompress of same shot
    LOOSE_A, LOOSE_D = 12, 18
    LOOSE_MSE = 180.0

    strong: list[tuple[Path, Path, int, int, float]] = []
    loose: list[tuple[Path, Path, int, int, float]] = []

    for i, p1 in enumerate(paths_ok):
        e1 = entries[p1]
        for p2 in paths_ok[i + 1 :]:
            e2 = entries[p2]
            ha = hamming64(e1.ah, e2.ah)
            hd = hamming64(e1.dh, e2.dh)
            need_mse = (
                ha <= LOOSE_A + 6 and hd <= LOOSE_D + 6 or (ha <= 20 and hd <= 24)
            )
            mse = (
                mse_from_thumbs(e1.thumb_eq, e2.thumb_eq) if need_mse else 9999.0
            )

            if ha <= STRICT_A and hd <= STRICT_D and mse <= STRONG_MSE:
                strong.append((p1, p2, ha, hd, mse))
            elif (
                ha <= LOOSE_A and hd <= LOOSE_D and mse <= LOOSE_MSE
            ) or (
                mse < 35.0 and ha <= 14 and hd <= 22
            ):
                loose.append((p1, p2, ha, hd, mse))

    def key_pair(t):
        a, b = sorted((rel(t[0]), rel(t[1])))
        return (a, b)

    # Dedupe pairs in loose that are already in strong
    strong_set = {key_pair(t) for t in strong}
    loose = [t for t in loose if key_pair(t) not in strong_set]

    print(
        "=== 2) تشابه بصري قوي (aHash≤{}، dHash≤{}، MSE≤{}) ===\n".format(
            STRICT_A, STRICT_D, int(STRONG_MSE)
        )
    )
    if not strong:
        print("لم يُعثر على أزواج بهذا الحد الصارم.\n")
    else:
        for p1, p2, ha, hd, mse in sorted(strong, key=key_pair):
            print(f"{rel(p1)}  ⟷  {rel(p2)}")
            print(f"   Hamming aHash={ha}, dHash={hd}, MSE(eq.thumb)={mse:.1f}\n")

    print(
        f"=== 3) تشابه محتمل (aHash≤{LOOSE_A}, dHash≤{LOOSE_D} أو MSE<threshold مع قيود على الهاش) ===\n"
    )
    if not loose:
        print("لا توجد أزواج في هذا المستوى (بعد استبعاد الموجودة في §2).\n")
    else:
        for p1, p2, ha, hd, mse in sorted(loose, key=key_pair)[:40]:
            print(f"{rel(p1)}  ⟷  {rel(p2)}")
            print(f"   Hamming aHash={ha}, dHash={hd}, MSE(eq.thumb)={mse:.1f}\n")
        if len(loose) > 40:
            print(f"... و {len(loose) - 40} زوجاً إضافياً في هذا التصنيف.\n")

    print("=== ملاحظة ===")
    print(
        "§2 يجمع الهاش مع خطأ الإبهام المصغّر بعد تسوية الشدة لتقليل الأخطاء في صور الصالة المتشابهة. §3 للمراجعة اليدوية.\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
