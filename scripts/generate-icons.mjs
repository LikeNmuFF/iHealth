import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Crop above the wordmark without changing any pixels of the supplied symbol.
await sharp("public/logo/Cl4ud3x_StartupLogo_PSC11.png")
  .extract({ left: 124, top: 20, width: 828, height: 764 })
  .extend({ top: 32, bottom: 32, left: 0, right: 0, background: "#00000000" })
  .png()
  .toFile("public/logo/mark.png");

// All app icons derive from the same text-free brand mark.
const source = "public/logo/mark.png";
await mkdir("public/icons", { recursive: true });

async function icon(size, target, scale = 0.84) {
  const mark = await sharp(source)
    .resize(Math.round(size * scale), Math.round(size * scale), {
      fit: "inside",
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(target);
}

await icon(48, "public/icon.png", 0.96);
for (const size of [192, 512])
  await icon(size, `public/icons/icon-${size}.png`);
// Keep the complete symbol inside the maskable icon's central safe circle.
await icon(512, "public/icons/icon-maskable-512.png", 0.56);
