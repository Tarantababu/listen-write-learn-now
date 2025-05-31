
import { generateSitemapUrls, generateSitemapXml } from './sitemapGenerator';

export const generateAndSaveSitemap = () => {
  try {
    const urls = generateSitemapUrls();
    const sitemapXml = generateSitemapXml(urls);
    
    console.log('Generated sitemap XML:');
    console.log(sitemapXml);
    
    // In a production environment, you would save this to public/sitemap.xml
    // For now, we'll log it so you can copy it manually
    return sitemapXml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return null;
  }
};

// Auto-generate sitemap when this module is imported
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only auto-generate in development
  generateAndSaveSitemap();
}
