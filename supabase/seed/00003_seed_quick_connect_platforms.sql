-- ============================================
-- Seed Quick Connect Platforms
-- ============================================

INSERT INTO quick_connect_platforms (name, slug, logo_url, description, status, sort_order) VALUES
('Blogger', 'blogger', 'https://cdn.sitesbd.com/logos/blogger.svg', 'Connect your Blogger blog to SitesBD for DNS management', 'active', 1),
('Vercel', 'vercel', 'https://cdn.sitesbd.com/logos/vercel.svg', 'Deploy to Vercel with custom domain DNS powered by SitesBD', 'active', 2),
('GitHub Pages', 'github-pages', 'https://cdn.sitesbd.com/logos/github.svg', 'Host static sites on GitHub Pages with SitesBD DNS', 'active', 3),
('Netlify', 'netlify', 'https://cdn.sitesbd.com/logos/netlify.svg', 'Deploy to Netlify with automatic DNS configuration', 'active', 4),
('Cloudflare Pages', 'cloudflare-pages', 'https://cdn.sitesbd.com/logos/cloudflare.svg', 'Cloudflare Pages integration for edge deployments', 'active', 5),
('Render', 'render', 'https://cdn.sitesbd.com/logos/render.svg', 'Host web services on Render with SitesBD DNS', 'active', 6),
('Firebase', 'firebase', 'https://cdn.sitesbd.com/logos/firebase.svg', 'Firebase Hosting with custom domain DNS management', 'active', 7),
('Railway', 'railway', 'https://cdn.sitesbd.com/logos/railway.svg', 'Deploy to Railway with DNS configuration', 'active', 8),
('Surge', 'surge', 'https://cdn.sitesbd.com/logos/surge.svg', 'Simple static web publishing with Surge.sh', 'active', 9);
