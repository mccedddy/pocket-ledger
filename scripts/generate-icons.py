"""Generate the small set of PWA icons committed under public/.

Not part of the npm build. Run manually only if the icon design changes.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"
APPLE_OUT = ROOT / "public"

BG = (225, 29, 72, 255)
FG = (255, 255, 255, 255)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "arialbd.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "DejaVuSans-Bold.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = int(size * 0.22)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

    font = load_font(int(size * 0.36))
    text = "PL"
    box = draw.textbbox((0, 0), text, font=font)
    text_w = box[2] - box[0]
    text_h = box[3] - box[1]
    draw.text(
        ((size - text_w) / 2 - box[0], (size - text_h) / 2 - box[1]),
        text,
        font=font,
        fill=FG,
    )
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for size in (192, 512):
        draw_icon(size).save(OUT / f"icon-{size}.png")

    apple = draw_icon(180).convert("RGB")
    apple.save(APPLE_OUT / "apple-touch-icon.png")

    favicon = draw_icon(64).convert("RGB")
    favicon.save(
        APPLE_OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )

    print("Generated icons in public/")


if __name__ == "__main__":
    main()
