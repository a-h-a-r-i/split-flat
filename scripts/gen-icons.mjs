// Generates minimal valid PNG icons using raw PNG encoding (no deps)
import { writeFileSync, mkdirSync } from 'fs';
import zlib from 'zlib';

mkdirSync('public/icons', { recursive: true });

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcIn = Buffer.concat([typeB, d]);
  return Buffer.concat([u32be(d.length), typeB, d, u32be(crc32(crcIn))]);
}

function makePNG(size) {
  // Teal background #0f766e + white "S" drawn via pixels
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = chunk('IHDR', Buffer.concat([
    u32be(size), u32be(size),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit RGB
  ]));

  // Build raw pixel rows
  const rows = [];
  const cx = size / 2, cy = size / 2, rad = size * 0.42;

  // Simple "S" glyph — rasterize from bezier points approximation
  // We'll just do a filled circle background + white text pixels via scanline
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3); // filter byte + RGB
    row[0] = 0; // None filter
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cornerR = size * 0.18;
      // Rounded rect test
      const ax = Math.abs(dx), ay = Math.abs(dy);
      const inRect = ax <= size / 2 - 1 && ay <= size / 2 - 1;
      const inCorner = ax > size / 2 - cornerR && ay > size / 2 - cornerR;
      const cornerDist = Math.sqrt((ax - (size / 2 - cornerR)) ** 2 + (ay - (size / 2 - cornerR)) ** 2);
      const inShape = inRect && (!inCorner || cornerDist <= cornerR);

      let r = 0, g = 0, b = 0;
      if (inShape) {
        // Teal gradient
        const t = (x + y) / (size * 2);
        r = Math.round(15 + t * (20 - 15));
        g = Math.round(118 + t * (184 - 118));
        b = Math.round(110 + t * (166 - 110));

        // Draw white "S" letter using pixel pattern
        const nx = (x - size * 0.32) / (size * 0.36); // 0..1 across letter
        const ny = (y - size * 0.2) / (size * 0.6);   // 0..1 down letter
        const isS = drawS(nx, ny, size);
        if (isS) { r = 255; g = 255; b = 255; }
      }
      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = zlib.deflateSync(rawData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Returns true if pixel at normalized (nx, ny) should be white (part of "S")
function drawS(nx, ny, size) {
  const stroke = 0.18; // stroke width in normalized units
  // S is made of 3 arcs — approximate with thick bezier
  // Top arc: y~0..0.4, curves right→left
  // Mid connection
  // Bottom arc: y~0.6..1, curves left→right

  // Simple approach: use thick stroke lines
  function near(x1, y1, x2, y2, px, py, w) {
    // distance from point to segment
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1) < w;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) < w;
  }

  const w = stroke;
  // Top bar
  if (near(0.15, 0.05, 0.85, 0.05, nx, ny, w)) return true;
  // Top-right down
  if (near(0.85, 0.05, 0.85, 0.45, nx, ny, w)) return true;
  // Middle bar
  if (near(0.15, 0.5, 0.85, 0.5, nx, ny, w)) return true;
  // Bottom-left down
  if (near(0.15, 0.55, 0.15, 0.95, nx, ny, w)) return true;
  // Bottom bar
  if (near(0.15, 0.95, 0.85, 0.95, nx, ny, w)) return true;
  // Top-left cap
  if (near(0.15, 0.05, 0.15, 0.5, nx, ny, w)) return true;
  // Bottom-right cap
  if (near(0.85, 0.5, 0.85, 0.95, nx, ny, w)) return true;
  return false;
}

writeFileSync('public/icons/icon-192.png', makePNG(192));
writeFileSync('public/icons/icon-512.png', makePNG(512));
console.log('✓ Icons generated: public/icons/icon-192.png, public/icons/icon-512.png');
