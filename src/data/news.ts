export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  published: boolean;
  published_at: string;
  author?: string;
  excerpt?: string;
  image_url?: string;
  video_url?: string;
  content: string;
}

// Eagerly load all news markdown files in src/data/news/
const newsModules = import.meta.glob<{ default: string }>('/src/data/news/*.md', { query: '?raw', eager: true });

function parseArticle(raw: string): Omit<NewsArticle, 'slug'> {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---([^\n]*)(?:\r?\n)?([\s\S]*)$/;
  const match = raw.match(frontmatterRegex);
  
  if (!match) {
    return {
      id: '',
      title: 'Untitled',
      category: 'Announcements',
      published: false,
      published_at: '',
      content: raw
    };
  }
  
  const yamlBlock = match[1];
  const sameLineContent = match[2] || '';
  const restContent = match[3] || '';
  const content = sameLineContent.trim() ? (sameLineContent + '\n' + restContent) : restContent;
  const metadata: any = {};
  
  const lines = yamlBlock.split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.slice(0, colonIndex).trim();
      let val = line.slice(colonIndex + 1).trim();
      
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/\\"/g, '"');
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1).replace(/\\'/g, "'");
      }
      
      if (val === 'true') {
        metadata[key] = true;
      } else if (val === 'false') {
        metadata[key] = false;
      } else {
        metadata[key] = val;
      }
    }
  }
  
  return {
    id: metadata.id || '',
    title: metadata.title || 'Untitled',
    category: metadata.category || 'Announcements',
    published: metadata.published !== false,
    published_at: metadata.published_at || '',
    author: metadata.author,
    excerpt: metadata.excerpt,
    image_url: metadata.image_url,
    video_url: metadata.video_url,
    content
  };
}

export const localNewsArticles: NewsArticle[] = Object.entries(newsModules).map(([filePath, module]) => {
  // Extract slug from filename (e.g. /src/data/news/were-back.md -> were-back)
  const filename = filePath.split('/').pop() || '';
  const slug = filename.replace(/\.md$/, '');
  const parsed = parseArticle(module.default);
  return {
    ...parsed,
    slug
  };
});

// Sort by published_at descending
const sortedNewsArticles = [...localNewsArticles].sort((a, b) => {
  return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
});

export function getLocalNewsArticles(): NewsArticle[] {
  return sortedNewsArticles;
}

export function getLocalNewsArticle(slug: string): NewsArticle | undefined {
  return localNewsArticles.find((a) => a.slug === slug);
}
