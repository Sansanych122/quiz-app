import { useEffect } from 'react';

export default function SEO({ 
  title = 'UniQuiz — Твій розумний AI-асистент для навчання',
  description = 'UniQuiz перетворює лекції та конспекти на інтерактивні тести за допомогою штучного інтелекту.',
  canonical = 'https://uniquiz.pages.dev/',
  noindex = false,
}) {
  useEffect(() => {
    // 1. Оновлення Title
    document.title = title;

    // 2. Оновлення Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // 3. Оновлення Canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    // 4. Оновлення Robots (noindex для приватних сторінок)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = noindex ? 'noindex, nofollow' : 'index, follow';
  }, [title, description, canonical, noindex]);

  return null;
}
