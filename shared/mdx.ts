import { promises as fs } from 'fs';
import matter from 'gray-matter';
import mdxPrism from 'mdx-prism';
import renderToString from 'next-mdx-remote/render-to-string';
import { MdxRemote } from 'next-mdx-remote/types';
import path from 'path';
import readingTime from 'reading-time';

import { MDXComponents } from '$/blocks/MDXComponents';

const root = process.cwd();

export async function getFiles(type: string): Promise<string[]> {
  return fs.readdir(path.join(root, 'data', type));
}

export type MDXSource = {
  mdxSource: MdxRemote.Source;
  frontMatter: {
    wordCount: number;
    readingTime: ReturnType<typeof readingTime>;
    slug: string | null;
    [key: string]: $TsAny;
  };
};

export async function getFileBySlug(type: string, slug?: string): Promise<MDXSource> {
  const source = await (slug
    ? fs.readFile(path.join(root, 'posts', type, `${slug}.mdx`), 'utf8')
    : fs.readFile(path.join(root, 'posts', `${type}.mdx`), 'utf8'));

  const { data, content } = matter(source);
  const mdxSource = await renderToString(content, {
    components: MDXComponents,
    mdxOptions: {
      remarkPlugins: [
        // require('remark-autolink-headings'),
        // require('remark-slug'),
        // require('remark-code-titles')
      ],
      rehypePlugins: [mdxPrism],
    },
  });

  return {
    mdxSource,
    frontMatter: {
      wordCount: content.split(/\s+/gu).length,
      readingTime: readingTime(content),
      slug: slug || null,
      ...data,
    },
  };
}

export type FrontMatterData = {
  slug: string;
  [key: string]: $TsAny;
};

export async function getAllFilesFrontMatter(type: string): Promise<FrontMatterData[]> {
  const files = await fs.readdir(path.join(root, 'data', type));

  return Promise.all(
    files.map(async (postSlug: string) => {
      const source = await fs.readFile(path.join(root, 'data', type, postSlug), 'utf8');
      const { data } = matter(source);

      return {
        ...data,
        slug: postSlug.replace('.mdx', ''),
      };
    }),
  );
}