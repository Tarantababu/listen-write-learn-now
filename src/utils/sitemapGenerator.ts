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

import { supabase } from '@/integrations/supabase/client';

// New function to fetch blog posts for sitemap
export const generateBlogSitemapUrls = async () => {
  const baseUrl = 'https://lwlnow.com';
  
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    
    if (error) throw error;
    
    return posts?.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updated_at || post.published_at || new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.7
    })) || [];
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }
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

// Enhanced function to generate complete sitemap with blog posts
export const generateCompleteSitemap = async () => {
  const staticUrls = generateSitemapUrls();
  const blogUrls = await generateBlogSitemapUrls();
  const allUrls = [...staticUrls, ...blogUrls];
  return generateSitemapXml(allUrls);
};

// Function specifically for generating dynamic sitemap (for API endpoints)
export const generateDynamicSitemap = async () => {
  return await generateCompleteSitemap();
};
