# -*- coding: utf-8 -*-
"""
build_site_images.py - slike izdelkov za mreže na strani (od prenove 2026-10-27).

Za vsak izdelek iz src/data/products.json naredi eno WebP sliko v public/p/:
  - "scene"  : Flow lifestyle scena iz ../ai-assets/<slug>.png (ista kot na pinu), 600x800 (3:4)
  - "cutout" : izdelek na belem, izrezan iz stare kartice public/img/<slug>.jpg, 600x600
in zapiše manifest src/data/photos.json (slug -> {src, kind, w, h}).

products.json se NE spreminja (ga piše dnevna rutina), zato ni konfliktov pri združevanju.
Idempotentno: obstoječe WebP preskoči (razen z --force).

    py build_site_images.py            # manjkajoče
    py build_site_images.py --force    # vse znova
"""
import argparse
import json
import os
import sys

from PIL import Image, ImageOps

BASE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(BASE)
PRODUCTS = os.path.join(BASE, "src", "data", "products.json")
MANIFEST = os.path.join(BASE, "src", "data", "photos.json")
OUT_DIR = os.path.join(BASE, "public", "p")
CARD_DIR = os.path.join(BASE, "public", "img")
AI_DIR = os.path.join(PARENT, "ai-assets")

SCENE_SIZE = (600, 800)
CUTOUT_SIZE = (600, 600)
QUALITY = 80
# Stara spletna kartica (build_site_data.render_web_card): platno 1080, bela kartica
# od 70 do 1010 z radijem 40. Notranjost brez zaobljenih robov je 84..996.
CARD_INNER = (84, 84, 996, 996)


def make_scene(src_png: str, dst: str):
    img = Image.open(src_png).convert("RGB")
    img = ImageOps.fit(img, SCENE_SIZE, Image.LANCZOS, centering=(0.5, 0.5))
    img.save(dst, "WEBP", quality=QUALITY, method=6)


def make_cutout(card_jpg: str, dst: str):
    card = Image.open(card_jpg).convert("RGB")
    if card.size == (1080, 1080):
        card = card.crop(CARD_INNER)
    # obreži belino okrog izdelka, nato ga postavi na enakomerno belo s 7 % roba
    mask = card.convert("L").point(lambda p: 255 if p < 244 else 0)
    box = mask.getbbox()
    if box:
        card = card.crop(box)
    pad = int(CUTOUT_SIZE[0] * 0.07)
    inner = (CUTOUT_SIZE[0] - 2 * pad, CUTOUT_SIZE[1] - 2 * pad)
    card = ImageOps.contain(card, inner, Image.LANCZOS)
    canvas = Image.new("RGB", CUTOUT_SIZE, (255, 255, 255))
    canvas.paste(card, ((CUTOUT_SIZE[0] - card.width) // 2, (CUTOUT_SIZE[1] - card.height) // 2))
    canvas.save(dst, "WEBP", quality=QUALITY, method=6)


def build(force=False, only=None):
    products = json.load(open(PRODUCTS, encoding="utf-8"))
    manifest = {}
    if os.path.exists(MANIFEST) and not force:
        manifest = json.load(open(MANIFEST, encoding="utf-8"))
    os.makedirs(OUT_DIR, exist_ok=True)
    made = kept = missing = 0
    for p in products:
        slug = p.get("slug")
        if not slug or (only and slug not in only):
            continue
        dst = os.path.join(OUT_DIR, f"{slug}.webp")
        scene = os.path.join(AI_DIR, f"{slug}.png")
        card = os.path.join(CARD_DIR, f"{slug}.jpg")
        kind = "scene" if os.path.exists(scene) else "cutout"
        size = SCENE_SIZE if kind == "scene" else CUTOUT_SIZE
        if os.path.exists(dst) and not force and slug in manifest:
            kept += 1
            continue
        try:
            if kind == "scene":
                make_scene(scene, dst)
            elif os.path.exists(card):
                make_cutout(card, dst)
            else:
                missing += 1
                print(f"  ni vira za {slug}", file=sys.stderr)
                continue
        except Exception as exc:  # ena pokvarjena slika ne sme ustaviti builda
            missing += 1
            print(f"  NAPAKA {slug}: {exc}", file=sys.stderr)
            continue
        manifest[slug] = {"src": f"/p/{slug}.webp", "kind": kind, "w": size[0], "h": size[1]}
        made += 1
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1, sort_keys=True)
    print(f"[images] novih {made}, obstoječih {kept}, brez vira {missing} -> public/p/, src/data/photos.json")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    build(force=a.force)
