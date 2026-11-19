# Draws the app icon (green square, white card, "+1") as PNG files with no dependencies.
# Usage: python -I tools/make-icons.py
import struct, zlib, os

GREEN = (0x0b, 0x6e, 0x4f)
WHITE = (0xff, 0xff, 0xff)

# 5x7 bitmap glyphs for "+" and "1".
GLYPHS = {
    '+': ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
    '1': ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
}

def draw(size):
    px = [[GREEN] * size for _ in range(size)]
    s = size / 512
    x0, y0, x1, y1, r = 136 * s, 96 * s, 376 * s, 416 * s, 28 * s
    for y in range(size):
        for x in range(size):
            cx, cy = x + 0.5, y + 0.5
            if x0 <= cx <= x1 and y0 <= cy <= y1:
                dx = max(x0 + r - cx, 0, cx - (x1 - r))
                dy = max(y0 + r - cy, 0, cy - (y1 - r))
                if dx * dx + dy * dy <= r * r:
                    px[y][x] = WHITE
    cell = 20 * s
    text = "+1"
    width = len(text) * 5 * cell + (len(text) - 1) * cell
    left = 256 * s - width / 2
    top = 256 * s - 3.5 * cell
    for i, ch in enumerate(text):
        gx = left + i * 6 * cell
        for row, bits in enumerate(GLYPHS[ch]):
            for col, b in enumerate(bits):
                if b != '1':
                    continue
                for y in range(int(top + row * cell), int(top + (row + 1) * cell)):
                    for x in range(int(gx + col * cell), int(gx + (col + 1) * cell)):
                        px[y][x] = GREEN
    return px

def png(px):
    h, w = len(px), len(px[0])
    raw = b''.join(b'\x00' + bytes(c for p in row for c in p) for row in px)
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

here = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
for size in (180, 192, 512):
    with open(os.path.join(here, f'icon-{size}.png'), 'wb') as f:
        f.write(png(draw(size)))
    print('icon', size)
