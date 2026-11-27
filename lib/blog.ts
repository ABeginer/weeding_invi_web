import fs from "node:fs";
import path from "node:path";
import { BUNDLED_BLOG_FILES } from "./blog-bundle.generated.ts";

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogHeading {
  id: string;
  text: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  category?: string;
  tags: string[];
  cover?: string;
  readingTimeMinutes: number;
  faqs: BlogFaqItem[];
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  headings: BlogHeading[];
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export function slugifyHeading(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function unquoteYamlValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }
  return trimmed;
}

function parseFrontmatter(rawFile: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const normalized = rawFile.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { data: {}, body: normalized };
  }

  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, body: normalized };
  }

  const frontmatterBlock = normalized.slice(4, endIndex);
  const body = normalized.slice(endIndex + 5);
  const data: Record<string, unknown> = {};
  const lines = frontmatterBlock.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      i += 1;
      continue;
    }

    const key = match[1];
    const rest = match[2].trim();

    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(",").map((item) => unquoteYamlValue(item))
        : [];
      i += 1;
      continue;
    }

    if (rest === "") {
      const listItems: unknown[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        if (!nextLine.trim()) {
          j += 1;
          continue;
        }
        if (!/^\s+/.test(nextLine)) {
          break;
        }

        const itemObjMatch = nextLine.match(/^\s+-\s+([A-Za-z0-9_-]+):\s*(.*)$/);
        if (itemObjMatch) {
          const obj: Record<string, string> = {
            [itemObjMatch[1]]: unquoteYamlValue(itemObjMatch[2]),
          };
          j += 1;
          while (j < lines.length && /^\s{4,}[A-Za-z0-9_-]+:\s*/.test(lines[j])) {
            const subMatch = lines[j].match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
            if (subMatch) {
              obj[subMatch[1]] = unquoteYamlValue(subMatch[2]);
            }
            j += 1;
          }
          listItems.push(obj);
          continue;
        }

        const scalarItemMatch = nextLine.match(/^\s+-\s+(.*)$/);
        if (scalarItemMatch) {
          listItems.push(unquoteYamlValue(scalarItemMatch[1]));
          j += 1;
          continue;
        }

        j += 1;
      }
      data[key] = listItems;
      i = j;
      continue;
    }

    data[key] = unquoteYamlValue(rest);
    i += 1;
  }

  return { data, body };
}

function stripMdxPreamble(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      out.push(line);
      continue;
    }
    if (!inCodeFence) {
      if (/^(import|export)\s+/.test(line.trim())) continue;
      if (/^\{\/\*.*\*\/\}$/.test(line.trim())) continue;
    }
    out.push(line);
  }

  return out.join("\n").trim();
}

export function extractH2Headings(markdown: string): BlogHeading[] {
  const headings: BlogHeading[] = [];
  const usedIds = new Map<string, number>();
  let inCodeFence = false;

  for (const line of markdown.split("\n")) {
    if (line.trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    const text = match[1].replace(/[*_`]/g, "").trim();
    if (!text) continue;
    const baseId = slugifyHeading(text) || "section";
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    headings.push({ id, text });
  }

  return headings;
}

function estimateReadingTime(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`[\]()-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function parseFaqs(raw: unknown): BlogFaqItem[] {
  if (!Array.isArray(raw)) return [];
  const items: BlogFaqItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const answer = typeof record.answer === "string" ? record.answer.trim() : "";
    if (question && answer) {
      items.push({ question, answer });
    }
  }
  return items;
}

function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function readAllBlogSourceFiles(): Array<{ file: string; raw: string }> {
  try {
    if (fs.existsSync(BLOG_DIR)) {
      const files = fs
        .readdirSync(BLOG_DIR)
        .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
      if (files.length > 0) {
        return files.map((file) => ({
          file,
          raw: fs.readFileSync(path.join(BLOG_DIR, file), "utf8"),
        }));
      }
    }
  } catch {
    // Cloudflare Workers isolate has no runtime filesystem; fall back to bundled posts.
  }

  return Object.entries(BUNDLED_BLOG_FILES).map(([file, raw]) => ({
    file,
    raw,
  }));
}

function readBlogSourceBySlug(slug: string): string | null {
  const candidates = [`${slug}.mdx`, `${slug}.md`];

  try {
    if (fs.existsSync(BLOG_DIR)) {
      const fileName = candidates.find((candidate) =>
        fs.existsSync(path.join(BLOG_DIR, candidate)),
      );
      if (fileName) {
        return fs.readFileSync(path.join(BLOG_DIR, fileName), "utf8");
      }
    }
  } catch {
    // Fall back to bundled posts on Cloudflare Workers.
  }

  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(BUNDLED_BLOG_FILES, candidate)) {
      return BUNDLED_BLOG_FILES[candidate];
    }
  }

  return null;
}

export function getAllBlogPosts(): BlogPostMeta[] {
  const sourceFiles = readAllBlogSourceFiles();
  if (sourceFiles.length === 0) return [];

  const posts: BlogPostMeta[] = [];
  for (const { file, raw } of sourceFiles) {
    const slug = file.replace(/\.(mdx|md)$/, "");
    const { data, body } = parseFrontmatter(raw);
    const content = stripMdxPreamble(body);
    const title = typeof data.title === "string" ? data.title.trim() : slug;
    const description =
      typeof data.description === "string" ? data.description.trim() : "";
    const date = typeof data.date === "string" ? data.date.trim() : "";
    const updated =
      typeof data.updated === "string" ? data.updated.trim() : undefined;
    const author =
      typeof data.author === "string" && data.author.trim()
        ? data.author.trim()
        : "Inviwedd";
    const category =
      typeof data.category === "string" && data.category.trim()
        ? data.category.trim()
        : undefined;
    const cover =
      typeof data.cover === "string" && data.cover.trim()
        ? data.cover.trim()
        : undefined;

    posts.push({
      slug,
      title,
      description,
      date,
      updated,
      author,
      category,
      tags: parseTags(data.tags),
      cover,
      readingTimeMinutes: estimateReadingTime(content),
      faqs: parseFaqs(data.faqs),
    });
  }

  return posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const raw = readBlogSourceBySlug(slug);
  if (!raw) return null;

  const { data, body } = parseFrontmatter(raw);
  const content = stripMdxPreamble(body);
  const title = typeof data.title === "string" ? data.title.trim() : slug;
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const date = typeof data.date === "string" ? data.date.trim() : "";
  const updated =
    typeof data.updated === "string" ? data.updated.trim() : undefined;
  const author =
    typeof data.author === "string" && data.author.trim()
      ? data.author.trim()
      : "Inviwedd";
  const category =
    typeof data.category === "string" && data.category.trim()
      ? data.category.trim()
      : undefined;
  const cover =
    typeof data.cover === "string" && data.cover.trim()
      ? data.cover.trim()
      : undefined;

  return {
    slug,
    title,
    description,
    date,
    updated,
    author,
    category,
    tags: parseTags(data.tags),
    cover,
    readingTimeMinutes: estimateReadingTime(content),
    faqs: parseFaqs(data.faqs),
    content,
    headings: extractH2Headings(content),
  };
}
