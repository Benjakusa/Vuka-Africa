import { useEffect } from 'react';

/**
 * Sets the document title and updates the og:title meta tag for per-page SEO.
 * The suffix " | Vuka Afrique" is appended automatically.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const fullTitle = `${title} | Vuka Afrique`;
    document.title = fullTitle;

    // Also update og:title for social sharing previews
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);
  }, [title]);
}
