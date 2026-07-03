import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceSvg = readFileSync(join(root, "public/icon-source.svg"));
const iconsDir = join(root, "public/icons");
const publicDir = join(root, "public");

const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512, 1024];

const createIco = (pngBuffers) => {
  const images = pngBuffers.map((buffer) => {
    const width = buffer.readUInt32LE(16);
    const height = buffer.readUInt32LE(20);
    return { width, height, buffer };
  });

  const headerSize = 6 + images.length * 16;
  let offset = headerSize;
  const entries = images.map((image) => {
    const entry = {
      width: image.width >= 256 ? 0 : image.width,
      height: image.height >= 256 ? 0 : image.height,
      size: image.buffer.length,
      offset,
    };
    offset += image.buffer.length;
    return entry;
  });

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  entries.forEach((entry, index) => {
    const position = 6 + index * 16;
    header.writeUInt8(entry.width, position);
    header.writeUInt8(entry.height, position + 1);
    header.writeUInt8(0, position + 2);
    header.writeUInt8(0, position + 3);
    header.writeUInt16LE(1, position + 4);
    header.writeUInt16LE(32, position + 6);
    header.writeUInt32LE(entry.size, position + 8);
    header.writeUInt32LE(entry.offset, position + 12);
  });

  return Buffer.concat([header, ...images.map((image) => image.buffer)]);
};

for (const size of pwaSizes) {
  const output = join(iconsDir, `icon-${size}x${size}.png`);
  await sharp(sourceSvg).resize(size, size).png().toFile(output);
  console.log(`generated ${output}`);
}

const favicon16 = await sharp(sourceSvg).resize(16, 16).png().toBuffer();
const favicon32 = await sharp(sourceSvg).resize(32, 32).png().toBuffer();

await sharp(favicon16).toFile(join(publicDir, "favicon-16x16.png"));
await sharp(favicon32).toFile(join(publicDir, "favicon-32x32.png"));
writeFileSync(join(publicDir, "favicon.ico"), createIco([favicon16, favicon32]));

console.log("generated favicon assets from Lucide Music icon");
