/**
 * Converts public/favicon.svg to:
 * - public/apple-touch-icon.png (180x180)
 * - public/favicon-32x32.png (32x32)
 * - public/favicon-16x16.png (16x16)
 * - public/favicon.ico (multi-size: 16x16 + 32x32)
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const svgBuffer = readFileSync(join(root, "public", "favicon.svg"));

async function createPNG(size) {
  return sharp(svgBuffer).resize(size, size).png().toBuffer();
}

async function main() {
  // 180x180 apple-touch-icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(join(root, "public", "apple-touch-icon.png"));
  console.log("✅ public/apple-touch-icon.png (180x180)");

  // 32x32 favicon PNG
  await sharp(svgBuffer).resize(32, 32).png().toFile(join(root, "public", "favicon-32x32.png"));
  console.log("✅ public/favicon-32x32.png (32x32)");

  // 16x16 favicon PNG
  await sharp(svgBuffer).resize(16, 16).png().toFile(join(root, "public", "favicon-16x16.png"));
  console.log("✅ public/favicon-16x16.png (16x16)");

  // Create a minimal ICO file with 16x16 and 32x32 entries
  const icon16 = await createPNG(16);
  const icon32 = await createPNG(32);

  // ICO format: header (6 bytes) + directory entries (16 bytes each) + image data
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * 2;
  const dataOffset = headerSize + dirSize;

  const ico = Buffer.alloc(dataOffset + icon16.length + icon32.length);

  // ICO header
  ico.writeUInt16LE(0, 0);       // reserved
  ico.writeUInt16LE(1, 2);       // type: ICO
  ico.writeUInt16LE(2, 4);       // image count

  // Directory entry for 16x16
  ico.writeUInt8(16, headerSize);                    // width
  ico.writeUInt8(16, headerSize + 1);                // height
  ico.writeUInt8(0, headerSize + 2);                 // color palette
  ico.writeUInt8(0, headerSize + 3);                 // reserved
  ico.writeUInt16LE(1, headerSize + 4);              // color planes
  ico.writeUInt16LE(32, headerSize + 6);             // bits per pixel
  ico.writeUInt32LE(icon16.length, headerSize + 8);  // data size
  ico.writeUInt32LE(dataOffset, headerSize + 12);    // data offset

  // Directory entry for 32x32
  ico.writeUInt8(32, headerSize + dirEntrySize);
  ico.writeUInt8(32, headerSize + dirEntrySize + 1);
  ico.writeUInt8(0, headerSize + dirEntrySize + 2);
  ico.writeUInt8(0, headerSize + dirEntrySize + 3);
  ico.writeUInt16LE(1, headerSize + dirEntrySize + 4);
  ico.writeUInt16LE(32, headerSize + dirEntrySize + 6);
  ico.writeUInt32LE(icon32.length, headerSize + dirEntrySize + 8);
  ico.writeUInt32LE(dataOffset + icon16.length, headerSize + dirEntrySize + 12);

  // Write image data
  icon16.copy(ico, dataOffset);
  icon32.copy(ico, dataOffset + icon16.length);

  writeFileSync(join(root, "public", "favicon.ico"), ico);
  console.log("✅ public/favicon.ico (16x16 + 32x32)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
