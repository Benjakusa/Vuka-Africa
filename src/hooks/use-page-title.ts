import { useEffect } from 'react';

/**
 * Sets the document title and updates the og:title meta tag for per-page SEO.
 * The suffix " | Vuka Afrique" is appended automatically unless disabled.
 */
export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    // If the title already contains the pipe, don't append suffix
    const fullTitle = title.includes('|') ? title : `${title} | Vuka Afrique`;
    document.title = fullTitle;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);
    }

    // Ensure dynamically populated OG tags
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', 'website');

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', 'https://www.vukaafrique.com/og-image.jpg');
  }, [title, description]);
}
