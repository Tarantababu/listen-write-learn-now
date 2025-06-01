
// Utility to generate sitemap data for SEO
export const generateSitemapUrls = () => {
  const baseUrl = 'https://lwlnow.com';
  const currentDate = new Date().toISOString();
  
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/blog', priority: 0.8, changefreq: 'weekly' },
    { url: '/login', priority: 0.5, changefreq: 'monthly' },
    { url: '/signup', priority: 0.6, changefreq: 'monthly' },
    { url: '/language-selection', priority: 0.6, changefreq: 'monthly' },
    { url: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
    { url: '/terms-of-service', priority: 0.3, changefreq: 'yearly' },
    { url: '/cookie-policy', priority: 0.3, changefreq: 'yearly' },
  ];
  
  return staticPages.map(page => ({
    ...page,
    url: `${baseUrl}${page.url}`,
    lastmod: currentDate
  }));
};

export const generateSitemapXml = (urls: Array<{url: string, priority: number, changefreq: string, lastmod: string}>) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

// Function to generate and return the complete sitemap XML
export const generateCompleteSitemap = () => {
  const urls = generateSitemapUrls();
  return generateSitemapXml(urls);
};
