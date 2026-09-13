const fs = require("fs");
const path = require("path");

// Automatically ensure public directory exists and sync user-uploaded assets
try {
  const publicDir = path.join(__dirname, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const userDir = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\841e17ea-458a-42f5-8775-5c613db301fb\\.user_uploaded";
  const logoDst = path.join(publicDir, "logo.png");
  const logoSrc = path.join(userDir, "media_1789293949992.png");
  if (!fs.existsSync(logoDst) && fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, logoDst);
  }

  const darkDst = path.join(publicDir, "bg-dark.png");
  const darkSrc = path.join(userDir, "media_1789293593817.png");
  if (!fs.existsSync(darkDst) && fs.existsSync(darkSrc)) {
    fs.copyFileSync(darkSrc, darkDst);
  }

  const lightDst = path.join(publicDir, "bg-light.png");
  const lightSrc = path.join(userDir, "media_1789293593825.png");
  if (!fs.existsSync(lightDst) && fs.existsSync(lightSrc)) {
    fs.copyFileSync(lightSrc, lightDst);
  }
} catch (e) {
  console.warn("Asset sync notice:", e.message);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
