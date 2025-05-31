
import React, { useEffect } from 'react';
import { generateSitemapUrls, generateSitemapXml } from '@/utils/sitemapGenerator';

const SitemapPage: React.FC = () => {
  useEffect(() => {
    // Generate sitemap data
    const urls = generateSitemapUrls();
    const sitemapXml = generateSitemapXml(urls);
    
    // Set proper content type for XML
    document.documentElement.innerHTML = sitemapXml;
    document.documentElement.setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
  }, []);

  return null; // This component doesn't render anything visible
};

export default SitemapPage;
