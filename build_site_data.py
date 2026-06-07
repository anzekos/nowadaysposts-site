# -*- coding: utf-8 -*-
"""
build_site_data.py — iz ../winners.json zgradi vsebino za Astro stran.

Naredi:
  1) src/data/products.json — produkti z affiliate linki (BREZ cen — Amazon compliance),
  2) public/img/{slug}.jpg — ČISTE 1:1 web kartice (cream/white, brez teksta),
     self-hostane (NE hotlinkamo Amazon CDN-ja).

Ponovno uporabi:
  - affiliate-link builder iz ../publish.py (isti SiteStripe format),
  - slikovne primitive iz ../gen_image.py (cream gradient, bela kartica, trim_white).

Zagon:
    python build_site_data.py
(ali `npm run data` znotraj site/)

NE kliče nobenega Anthropic API.
"""
import json
import os
import sys
from datetime import date

from PIL import Image, ImageDraw, ImageFilter, ImageOps

BASE = os.path.dirname(os.path.abspath(__file__))      # .../amazon-pinterest/site
PARENT = os.path.dirname(BASE)                          # .../amazon-pinterest
sys.path.insert(0, PARENT)                              # da najdemo publish + gen_image

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from dotenv import load_dotenv                          # noqa: E402
from publish import build_affiliate_link                # noqa: E402
from gen_image import (                                 # noqa: E402
    fetch_product_image, trim_white, lerp, BG_TOP, BG_BOTTOM, CARD,
)

load_dotenv(os.path.join(PARENT, ".env"))
TAG = os.getenv("AMAZON_TAG_COM", "kosline01-20")
TLD = "com"
TODAY = date.today().isoformat()       # npr. "2026-06-07"

WINNERS = os.path.join(PARENT, "winners.json")
DATA_OUT = os.path.join(BASE, "src", "data", "products.json")
IMG_DIR = os.path.join(BASE, "public", "img")

# kategorija per ASIN (ročno mapirano za trenutno serijo; nove dodaj sem ali
# razširi z avtomatskim ugibanjem po ključnih besedah v naslovu)
CATEGORY = {
    "B0GYRT3FNL": "Mirrors", "B0FN3Z911R": "Mirrors", "B0FW47X87Q": "Mirrors",
    "B0CTJGJL2T": "Lighting", "B0BQHV84H6": "Wall Decor",
    "B08SBYPF14": "Curtains", "B0B3544GYM": "Curtains",
    "B0CS62J2G5": "Rugs", "B0D89V1RX1": "Rugs", "B0714K41PB": "Bedroom",
}

# rezerva: ugani kategorijo iz naslova, če ASIN ni v mapi
KEYWORD_CATEGORY = [
    (("mirror",), "Mirrors"),
    (("curtain", "drape", "sheer"), "Curtains"),
    (("rug", "runner", "carpet"), "Rugs"),
    (("lamp", "light", "candle warmer"), "Lighting"),
    (("shelf", "shelves", "wall"), "Wall Decor"),
    (("pillow", "duvet", "blanket", "sheet", "bedding"), "Bedroom"),
]


def guess_category(title: str) -> str:
    low = (title or "").lower()
    for keys, cat in KEYWORD_CATEGORY:
        if any(k in low for k in keys):
            return cat
    return "Home Decor"


def slugify(s: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in s.lower()).strip("-").replace("--", "-")


def render_web_card(product_img: Image.Image, size: int = 1080,
                    margin: int = 70, pad: int = 38) -> Image.Image:
    """Čista kvadratna kartica: cream gradient + bela zaobljena kartica s senco +
    produkt (obrezan bel rob) na sredini. Brez teksta — naslov/oceno pokaže HTML."""
    canvas = Image.new("RGB", (size, size), BG_TOP)
    g = ImageDraw.Draw(canvas)
    for y in range(size):
        g.line([(0, y), (size, y)], fill=lerp(BG_TOP, BG_BOTTOM, y / size))

    card = [margin, margin, size - margin, size - margin]
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [card[0], card[1] + 14, card[2], card[3] + 14], radius=40, fill=(70, 55, 40, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.paste(shadow, (0, 0), shadow)
    ImageDraw.Draw(canvas).rounded_rectangle(card, radius=40, fill=CARD)

    box_w = (card[2] - card[0]) - 2 * pad
    box_h = (card[3] - card[1]) - 2 * pad
    p = ImageOps.contain(trim_white(product_img).convert("RGBA"), (box_w, box_h))
    px = card[0] + pad + (box_w - p.width) // 2
    py = card[1] + pad + (box_h - p.height) // 2
    canvas.paste(p, (px, py), p)
    return canvas


def load_existing() -> dict:
    """Naloži obstoječ kumulativni products.json (asin -> produkt), da ohranimo
    starejše produkte in njihov originalni addedAt datum."""
    if os.path.exists(DATA_OUT):
        try:
            with open(DATA_OUT, "r", encoding="utf-8") as f:
                return {p["asin"]: p for p in json.load(f) if p.get("asin")}
        except (ValueError, KeyError, OSError):
            return {}
    return {}


def main():
    with open(WINNERS, "r", encoding="utf-8") as f:
        winners = json.load(f)

    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(DATA_OUT), exist_ok=True)

    existing = load_existing()          # asin -> produkt (kumulativno)
    made = skipped = failed = 0

    for i, w in enumerate(winners, 1):
        asin = w.get("asin")
        meta = w.get("image") or {}
        slug = meta.get("slug") or asin
        cat = CATEGORY.get(asin) or guess_category(w.get("title"))
        link = build_affiliate_link(TLD, asin, TAG, w)
        ref = w.get("image_url")

        img_rel = f"/img/{slug}.jpg"
        img_path = os.path.join(IMG_DIR, f"{slug}.jpg")
        if os.path.exists(img_path):
            skipped += 1
            print(f"[{i}] slika obstaja: {slug}.jpg")
        elif ref:
            try:
                render_web_card(fetch_product_image(ref)).save(
                    img_path, "JPEG", quality=86, optimize=True)
                made += 1
                print(f"[{i}] slika: {slug}.jpg")
            except Exception as exc:
                failed += 1
                print(f"[{i}] slika NAPAKA ({slug}): {exc}", file=sys.stderr)
        else:
            print(f"[{i}] {asin}: ni image_url -> brez slike", file=sys.stderr)

        # ohrani originalni datum dodajanja (za sortiranje "najnovejši")
        added_at = (existing.get(asin) or {}).get("addedAt") or TODAY
        existing[asin] = {
            "asin": asin,
            "slug": slug,
            "title": w.get("title", ""),
            "description": w.get("description", ""),
            "category": cat,
            "categorySlug": slugify(cat),
            "rating": meta.get("rating"),
            "image": img_rel,
            "link": link,
            "keywords": [h.lstrip("#") for h in (w.get("hashtags") or [])],
            "addedAt": added_at,
        }

    # zapiši kumulativno, najnovejši najprej (za "Trending now" na homepage)
    products = sorted(existing.values(),
                      key=lambda p: p.get("addedAt", ""), reverse=True)
    with open(DATA_OUT, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"\n[build] ✓ {len(products)} produktov skupaj (kumulativno) -> src/data/products.json")
    print(f"[build] slike: {made} novih, {skipped} obstoječih, {failed} napak -> public/img/")


if __name__ == "__main__":
    main()
