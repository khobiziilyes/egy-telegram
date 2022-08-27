export function firstRegexGroup(regex: RegExp, text: string): string | null {
  return (regex.exec(text) ?? [])[1] || null;
}

export function roundQuality(pixels) {
  const resolutionsMap = {
    '8K 4320p': 7680 * 4320,
    '4K 2160p': 3840 * 2160,
    '2K 1080p': 2048 * 1080,
    'Quad HD 1440p': 2560 * 1440,
    'Full HD 1080p': 1920 * 1080,
    'HD 720p': 1280 * 720,
    'SD 480p': 640 * 480,
    'SD 360p': 640 * 360,
    'SD 240p': 426 * 240,
    'Low 144p': 256 * 144
  };

  const entries = Object.entries(resolutionsMap);

  for (let i = 0; i < entries.length; i++) {
    const realPixels = entries[i][1];
    if (pixels >= realPixels) return entries[i - 1][0];
  }

  return `${pixels}p`;
}
