import sharp from "sharp";

export const processThumbnail = async (file) => {
  return sharp(file.buffer)
    .resize(400, 225)          // LMS thumbnail ratio
    .jpeg({ quality: 70 })     // strong compression
    .toBuffer();
};
