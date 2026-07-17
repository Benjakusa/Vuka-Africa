import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Styling ─────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ──────────────────────────────────────────────

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(num)) return 'KES —';
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const seconds = Math.floor((d.getTime() - Date.now()) / 1000);

  // Handle future dates
  if (seconds > 0) {
    return formatDate(date);
  }

  const absSeconds = Math.abs(seconds);
  const intervals: [string, number][] = [
    ['y', 31536000],
    ['mo', 2592000],
    ['w', 604800],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ];

  for (const [label, secs] of intervals) {
    const count = Math.floor(absSeconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }

  return 'just now';
}

export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('en-KE');
}

export function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseInline(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export function formatDescription(text: string): string {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const blocks = escaped.split(/\n\n+/);
  const html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      const lines = trimmed.split('\n');
      const nonEmptyLines = lines.filter((l) => l.trim());

      if (nonEmptyLines.length === 0) return '';

      const firstLine = nonEmptyLines[0];
      if (firstLine && /^#{1,3}\s/.test(firstLine)) {
        const match = firstLine.match(/^#+/);
        const level = match ? Math.min(match[0].length, 3) : 1;
        const text = firstLine.replace(/^#+\s*/, '');
        return `<h${level} class="font-bold text-dark">${parseInline(text)}</h${level}>`;
      }

      const allBullet = nonEmptyLines.every((l) => /^[-*]\s/.test(l));
      if (allBullet) {
        const items = nonEmptyLines
          .map((l) => l.replace(/^[-*]\s*/, ''))
          .map((item) => `<li class="text-body text-sm leading-relaxed">${parseInline(item)}</li>`);
        return `<ul class="list-disc pl-5 space-y-1">${items.join('')}</ul>`;
      }

      const allNumbered = nonEmptyLines.every((l) => /^\d+\.\s/.test(l));
      if (allNumbered) {
        const items = nonEmptyLines
          .map((l) => l.replace(/^\d+\.\s*/, ''))
          .map((item) => `<li class="text-body text-sm leading-relaxed">${parseInline(item)}</li>`);
        return `<ol class="list-decimal pl-5 space-y-1">${items.join('')}</ol>`;
      }

      const paragraphText = lines
        .map((l) => (l.trim() ? parseInline(l) : '<br>'))
        .join('\n');
      return `<p class="text-body text-sm leading-relaxed">${paragraphText}</p>`;
    })
    .filter(Boolean)
    .join('\n');
  return html;
}