export const READING_PROGRESS_RADIUS = 6
export const READING_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * READING_PROGRESS_RADIUS

/** Progress reaches completion when the final line of the body enters the reading viewport. */
export function readingProgress(top: number, height: number, viewport: number, offset: number) {
  const available = Math.max(1, viewport - offset)
  if (height <= available) return top <= offset ? 1 : 0
  return Math.max(0, Math.min(1, (offset - top) / (height - available)))
}
