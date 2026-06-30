const fs = require('fs');
const path = require('path');

const files = {
  'index.html': {
    title: 'AMK Creative Agency Bogor | Video Production, Digital Marketing, Branding',
    description: 'PT. Adikara Mandala Kreasi (AMK) adalah creative agency di Bogor yang menyediakan produksi video, desain brand, pemasaran digital, dan solusi konten untuk bisnis modern.',
    keywords: 'Creative Agency Bogor, Video Production Bogor, Digital Marketing Bogor, Branding Agency, Konten Kreatif',
    ogTitle: 'AMK Creative Agency Bogor | Video Production, Digital Marketing, Branding',
    ogDescription: 'PT. Adikara Mandala Kreasi (AMK) adalah creative agency di Bogor yang menyediakan produksi video, desain brand, pemasaran digital, dan solusi konten untuk bisnis modern.',
    ogImage: 'src/images/company.png'
  },
  'apps/pages/service-aicreative.html': {
    title: 'AI Creative Assistant | PT. Adikara Mandala Kreasi (AMK)',
    description: 'AI Creative Assistant dari AMK membantu brand menghasilkan konten visual, copy, dan kampanye kreatif yang lebih cepat, relevan, dan berpengaruh dengan dukungan kecerdasan buatan.',
    keywords: 'AI Creative Assistant, AI Content, Creative Agency Bogor, Konten AI, Desain AI',
    ogTitle: 'AI Creative Assistant | PT. Adikara Mandala Kreasi (AMK)',
    ogDescription: 'Solusi AI Creative Assistant untuk konten visual, copy, dan kampanye digital yang dipersonalisasi dan terukur.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/service-marketing.html': {
    title: 'Digital Marketing & Growth Strategy | AMK Bogor',
    description: 'Layanan digital marketing AMK membantu bisnis Bogor meningkatkan traffic, engagement, dan konversi melalui kampanye ads, SEO, konten, dan social media.',
    keywords: 'Digital Marketing Bogor, Growth Marketing, SEO, Social Media Management, Ads Strategy',
    ogTitle: 'Digital Marketing & Growth Strategy | AMK Bogor',
    ogDescription: 'Strategi digital marketing AMK dengan kampanye ads, SEO, content marketing, dan social media untuk hasil bisnis yang terukur.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/service-cinematic.html': {
    title: 'Cinematic Video Production | AMK Bogor',
    description: 'Produksi video sinematik AMK menciptakan storytelling visual untuk brand, commercial, dan konten social media dengan kualitas produksi tinggi.',
    keywords: 'Cinematic Video Production, Video Production Bogor, Brand Film, Commercial Video, Storytelling Video',
    ogTitle: 'Cinematic Video Production | AMK Bogor',
    ogDescription: 'Produksi video sinematik AMK menghadirkan storytelling visual untuk brand, commercial, dan konten social media dengan kualitas produksi tinggi.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/service-o2obrand.html': {
    title: 'O2O Brand Activation | PT. Adikara Mandala Kreasi (AMK)',
    description: 'Solusi O2O Brand Activation AMK menghubungkan pengalaman online dan offline untuk meningkatkan kunjungan toko, transaksi, dan kesetiaan pelanggan melalui kampanye omnichannel yang terukur.',
    keywords: 'O2O Brand Activation, Omnichannel Marketing, Aktivasi Brand, Online to Offline, Retail Marketing',
    ogTitle: 'O2O Brand Activation | PT. Adikara Mandala Kreasi (AMK)',
    ogDescription: 'Solusi O2O Brand Activation yang mengintegrasikan digital dan offline agar brand Anda lebih diingat, dikunjungi, dan dibeli.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/service-audio.html': {
    title: 'Audio Production & Sound Design | AMK Bogor',
    description: 'Layanan audio AMK menyediakan sound design, voice over, mixing, dan musik branding untuk meningkatkan kualitas produksi video dan kampanye multimedia Anda.',
    keywords: 'Audio Production Bogor, Sound Design, Voice Over, Music Branding, Audio Mixing',
    ogTitle: 'Audio Production & Sound Design | AMK Bogor',
    ogDescription: 'Layanan audio AMK menyediakan sound design, voice over, mixing, dan musik branding untuk meningkatkan kualitas produksi video dan kampanye multimedia Anda.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/portfolio.html': {
    title: 'Portofolio AMK | Showcase Creative Projects & Campaigns',
    description: 'Telusuri portofolio AMK yang menampilkan proyek branding, video, digital campaign, dan design experience untuk klien lokal dan korporat.',
    keywords: 'Portfolio Creative Agency, Branding Portfolio, Video Production Portfolio, Digital Campaigns, AMK Projects',
    ogTitle: 'Portofolio AMK | Showcase Creative Projects & Campaigns',
    ogDescription: 'Telusuri portofolio AMK yang menampilkan proyek branding, video, digital campaign, dan design experience untuk klien lokal dan korporat.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/portfolio-jica.html': {
    title: 'Portfolio JICA | AMK Creative Agency',
    description: 'Studi kasus JICA: solusi desain, konten, dan kampanye digital AMK untuk mendukung komunikasi dan branding organisasi global.',
    keywords: 'JICA Portfolio, Creative Agency Case Study, Branding JICA, Digital Campaign JICA',
    ogTitle: 'Portfolio JICA | AMK Creative Agency',
    ogDescription: 'Studi kasus JICA: solusi desain, konten, dan kampanye digital AMK untuk mendukung komunikasi dan branding organisasi global.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/portfolio-aston.html': {
    title: 'Portfolio Aston Bogor | AMK Creative Agency',
    description: 'Proyek Aston Bogor: desain visual, digital storytelling, dan brand activation oleh AMK untuk memperkuat pengalaman customer dan identitas korporat.',
    keywords: 'Aston Bogor Portfolio, Corporate Branding, Visual Design, Experience Design, Creative Agency',
    ogTitle: 'Portfolio Aston Bogor | AMK Creative Agency',
    ogDescription: 'Proyek Aston Bogor: desain visual, digital storytelling, dan brand activation oleh AMK untuk memperkuat pengalaman customer dan identitas korporat.',
    ogImage: '../../src/images/company.png'
  },
  'apps/pages/portfolio-nippon.html': {
    title: 'Portfolio Nippon Express | AMK Creative Agency',
    description: 'Proyek Nippon Express: solusi branding dan konten digital AMK untuk meningkatkan citra korporat dan engagement pelanggan.',
    keywords: 'Nippon Express Portfolio, Corporate Branding, Creative Campaign, Video Case Study, Digital Marketing',
    ogTitle: 'Portfolio Nippon Express | AMK Creative Agency',
    ogDescription: 'Proyek Nippon Express: solusi branding dan konten digital AMK untuk meningkatkan citra korporat dan engagement pelanggan.',
    ogImage: '../../src/images/company.png'
  }
};

function replaceTag(html, tag, value, isProperty = false, attribute = 'content') {
  const attr = isProperty ? 'property' : 'name';
  const regex = new RegExp(`<${tag}[^>]*${attr}="${tag === 'title' ? 'title' : tag}"[^>]*${attribute}=["'][^"']*["'][^>]*>`, 'gi');
  return html.replace(regex, (match) => {
    if (tag === 'title') {
      return `<title>${value}</title>`;
    }
    return match.replace(/(content=)(["'])([^"']*)(["'])/, `$1$2${value}$4`);
  });
}

const rootDir = path.join(__dirname, '..', '..');

function updateFile(filePath, metadata) {
  const fullPath = path.join(rootDir, filePath.replace(/\//g, path.sep));
  let html = fs.readFileSync(fullPath, 'utf8');

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${metadata.title}</title>`);
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${metadata.description}" />`);
  html = html.replace(/<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="${metadata.keywords}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${metadata.ogTitle}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${metadata.ogDescription}" />`);
  html = html.replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${metadata.ogImage}" />`);

  fs.writeFileSync(fullPath, html, 'utf8');
  console.log(`Updated ${filePath}`);
}

for (const [filePath, metadata] of Object.entries(files)) {
  updateFile(filePath, metadata);
}
