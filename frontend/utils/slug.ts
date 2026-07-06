import { v4 as uuid } from 'uuid';

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const shortId = uuid().slice(0, 8);
  return `${base}-${shortId}`;
}
