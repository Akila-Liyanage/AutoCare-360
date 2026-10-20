/**
 * Resolves an image path or URL to an absolute URL that the browser can load.
 * Supports:
 * - Full URLs: http://... or https://...
 * - Blob URLs: blob:...
 * - Data URLs: data:...
 * - Relative backend paths: /uploads/vehicles/xyz.jpg, /uploads/profile/..., etc.
 */
export const resolveImageUrl = (img?: string | null): string => {
  if (!img || !img.trim()) return '';
  const trimmed = img.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

export default resolveImageUrl;
