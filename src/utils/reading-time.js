export function calculateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

export function getReadingMeta(summaryText, fullText) {
  return {
    summaryReadTime: calculateReadingTime(summaryText),
    fullReadTime: calculateReadingTime(fullText),
    totalWords: summaryText.split(/\s+/).length + fullText.split(/\s+/).length
  };
}