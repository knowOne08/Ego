const GITHUB_REPO = 'knowOne08/blogs';
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

const blogs = [
  {
    id: 1,
    title: "How to NOT Build a Two-Stage Model Rocket",
    excerpt: "When engineering meets ambition... and occasionally, the ground. A detailed journey through our first two-stage rocket attempt, complete with failures, learnings, and explosions.",
    date: "2024-11-15",
    readTime: "12 min read",
    tags: ["Rocketry", "Engineering", "Aerospace"],
    featured: true,
    githubFolder: "How to NOT build a two stage model rocket",
    cover: ".gitbook/assets/spaceodessyimg.jpeg",
    status: "published",
  },
  {
    id: 2,
    title: "A Rocketeer's Guide to the Galaxy",
    excerpt: "If Propulsion is the heart of a rocket then Avionics is the brain and the nervous system. An introduction to avionics and guidance systems.",
    date: "2025-01-10",
    readTime: "10 min read",
    tags: ["Avionics", "Rocketry", "Guidance Systems"],
    featured: false,
    githubFolder: "A rocketeer's guide to the galaxy",
    cover: ".gitbook/assets/2001_space_art.jpg",
    status: "published",
  },
  {
    id: 3,
    title: "JustEase",
    excerpt: "A retrieval-augmented generation pipeline to improve how citizens access judicial data and case information from the Department of Justice.",
    date: "2025-02-01",
    readTime: "8 min read",
    tags: ["AI", "Legal Tech", "RAG"],
    featured: false,
    githubFolder: "JustEase",
    cover: null,
    status: "published",
  },
];

/**
 * Rewrite .gitbook/assets/ and relative image paths to GitHub raw URLs
 */
const processGitBookImages = (content, githubFolder) => {
  if (!content || !githubFolder) return content;

  let processed = content;
  const encodedFolder = encodeURIComponent(githubFolder);

  // ![alt](.gitbook/assets/file.ext)
  processed = processed.replace(
    /!\[([^\]]*)\]\(\.gitbook\/assets\/([^)]+)\)/g,
    (_, alt, filename) =>
      `![${alt}](${RAW_BASE}/${encodedFolder}/.gitbook/assets/${encodeURIComponent(filename.trim())})`
  );

  // <img src=".gitbook/assets/file.ext"
  processed = processed.replace(
    /(<img[^>]*src=["'])\.gitbook\/assets\/([^"']+)(["'][^>]*>)/g,
    (_, prefix, filename, suffix) =>
      `${prefix}${RAW_BASE}/${encodedFolder}/.gitbook/assets/${encodeURIComponent(filename.trim())}${suffix}`
  );

  // [text](.gitbook/assets/file.ext)
  processed = processed.replace(
    /\[([^\]]*)\]\(\.gitbook\/assets\/([^)]+)\)/g,
    (_, text, filename) =>
      `[${text}](${RAW_BASE}/${encodedFolder}/.gitbook/assets/${encodeURIComponent(filename.trim())})`
  );

  // ![alt](./image.jpg)
  processed = processed.replace(
    /!\[([^\]]*)\]\(\.\/([^)]+)\)/g,
    (_, alt, filename) =>
      `![${alt}](${RAW_BASE}/${encodedFolder}/${encodeURIComponent(filename.trim())})`
  );

  return processed;
};

export const getAllBlogs = () =>
  blogs
    .filter((b) => b.status === 'published')
    .map((b) => ({
      ...b,
      coverUrl: b.cover ? resolveGitBookPath(b.cover, b.githubFolder) : null,
    }));

export const getBlogById = (id) =>
  blogs.find((b) => b.id === Number(id)) || null;

/**
 * Parse YAML frontmatter from markdown and return { frontmatter, content }
 */
const parseFrontmatter = (markdown) => {
  const match = markdown.match(/^\s*---\n([\s\S]*?)\n---\s*/);
  if (!match) return { frontmatter: {}, content: markdown };

  const raw = match[1];
  const frontmatter = {};

  // Simple YAML parser for the fields we care about
  // Extract cover.light path
  const coverLightMatch = raw.match(/light:\s*(.+)/);
  if (coverLightMatch) frontmatter.coverLight = coverLightMatch[1].trim();

  const coverDarkMatch = raw.match(/dark:\s*(.+)/);
  if (coverDarkMatch) frontmatter.coverDark = coverDarkMatch[1].trim();

  const descMatch = raw.match(/^description:\s*(.+)/m);
  if (descMatch) frontmatter.description = descMatch[1].trim();

  const content = markdown.slice(match[0].length);
  return { frontmatter, content };
};

/**
 * Convert a .gitbook/assets/ path to a full GitHub raw URL
 */
export const resolveGitBookPath = (path, githubFolder) => {
  if (!path || path.startsWith('http')) return path;
  const encodedFolder = encodeURIComponent(githubFolder);
  const parts = path.split('/').map(p => encodeURIComponent(p));
  return `${RAW_BASE}/${encodedFolder}/${parts.join('/')}`;
};

/**
 * Fetch the main README.md content for a blog
 * Returns { content, cover }
 */
export const fetchBlogContent = async (blog) => {
  const url = `${RAW_BASE}/${encodeURIComponent(blog.githubFolder)}/README.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch blog content: ${res.status}`);
  const markdown = await res.text();

  const { frontmatter, content } = parseFrontmatter(markdown);

  const cover = frontmatter.coverLight
    ? resolveGitBookPath(frontmatter.coverLight, blog.githubFolder)
    : null;

  return {
    content: processGitBookImages(content, blog.githubFolder),
    cover,
  };
};

/**
 * Parse SUMMARY.md to get page list
 * Returns array of { title, filename }
 */
export const fetchBlogPages = async (blog) => {
  const url = `${RAW_BASE}/${encodeURIComponent(blog.githubFolder)}/SUMMARY.md`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();

  const pages = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const filename = match[2].trim();
    // Skip README.md since that's the main content
    if (filename.toLowerCase() === 'readme.md') continue;
    pages.push({ title: match[1], filename });
  }
  return pages;
};

/**
 * Fetch a specific page's markdown
 */
export const fetchBlogPage = async (blog, filename) => {
  const url = `${RAW_BASE}/${encodeURIComponent(blog.githubFolder)}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  const markdown = await res.text();
  return processGitBookImages(markdown, blog.githubFolder);
};
