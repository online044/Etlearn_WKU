import katex from 'katex';
import { TocHeading } from '../types/notes';

/**
 * Generates Table of Contents from Markdown headings (# H1, ## H2, ### H3)
 */
export function generateToc(markdown: string): TocHeading[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const headings: TocHeading[] = [];
  const idCounts = new Map<string, number>();

  for (const line of lines) {
    const trimmed = line.trim();
    // Ignore headings inside code blocks or callout tags
    if (trimmed.startsWith('```') || trimmed.startsWith(':::')) continue;

    const match = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3;
    let text = match[2].trim();
    // Clean markdown styling inside headings (e.g., bold/italics/backticks)
    text = text.replace(/[*_`]/g, '').trim();

    // Generate URL-friendly slug ID
    let slug = text
      .toLowerCase()
      .replace(/[^\w\s\u1200-\u137F-]/g, '') // preserve alphanumeric, latin, and Ge'ez glyphs
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) slug = `section-${headings.length + 1}`;

    const count = idCounts.get(slug) || 0;
    idCounts.set(slug, count + 1);
    const uniqueId = count === 0 ? slug : `${slug}-${count}`;

    headings.push({
      id: uniqueId,
      level,
      text
    });
  }

  return headings;
}

/**
 * Calculates reading time in minutes based on ~200 words per minute
 */
export function calculateReadingTime(markdown: string): number {
  if (!markdown) return 1;
  const clean = markdown.replace(/[#*`_~\[\]()>-]/g, ' ');
  const words = clean.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Renders LaTeX equations in text using KaTeX safely
 */
export function renderMathKaTeX(text: string): string {
  if (!text) return '';

  // 1. Block math: $$ ... $$
  let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
    try {
      return `<div class="katex-block-wrapper my-4 py-2 px-3 overflow-x-auto rounded-lg text-center font-mono select-all">${katex.renderToString(
        equation.trim(),
        { displayMode: true, throwOnError: false }
      )}</div>`;
    } catch {
      return `<pre class="katex-error text-amber-500 font-mono text-xs overflow-x-auto">${equation}</pre>`;
    }
  });

  // 2. Inline math: $ ... $ (ensuring not matched against currency like $100)
  processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (_, prefix, equation) => {
    // Avoid accidental dollar amounts like $50 or $10.00
    if (/^\d+([.,]\d+)?$/.test(equation.trim())) {
      return `${prefix}$${equation}$`;
    }
    try {
      const rendered = katex.renderToString(equation.trim(), {
        displayMode: false,
        throwOnError: false
      });
      return `${prefix}<span class="katex-inline select-all">${rendered}</span>`;
    } catch {
      return `${prefix}<code class="text-amber-500 font-mono text-xs">${equation}</code>`;
    }
  });

  return processed;
}

export type CalloutType = 'key-point' | 'definition' | 'example' | 'warning' | 'formula';

export interface ParsedCallout {
  type: CalloutType;
  title: string;
  amharicTitle: string;
  content: string;
}

export const CALLOUT_METADATA: Record<
  CalloutType,
  {
    title: string;
    amharicTitle: string;
    icon: string;
    borderClass: string;
    bgClass: string;
    badgeClass: string;
    textClass: string;
  }
> = {
  'key-point': {
    title: 'Key Takeaway',
    amharicTitle: 'ዋና ነጥብ',
    icon: 'Sparkles',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15',
    badgeClass: 'bg-amber-500 text-slate-950',
    textClass: 'text-amber-400'
  },
  definition: {
    title: 'Formal Definition',
    amharicTitle: 'መሰረታዊ ፍቺ',
    icon: 'BookOpen',
    borderClass: 'border-blue-500/40',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/15',
    badgeClass: 'bg-blue-500 text-white',
    textClass: 'text-blue-400'
  },
  example: {
    title: 'Worked Example',
    amharicTitle: 'ተግባራዊ ምሳሌ',
    icon: 'Lightbulb',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    badgeClass: 'bg-emerald-500 text-slate-950',
    textClass: 'text-emerald-400'
  },
  warning: {
    title: 'Exam Pitfall / Caution',
    amharicTitle: 'የፈተና ማስጠንቀቂያ',
    icon: 'AlertTriangle',
    borderClass: 'border-rose-500/40',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15',
    badgeClass: 'bg-rose-500 text-white',
    textClass: 'text-rose-400'
  },
  formula: {
    title: 'Essential Formula',
    amharicTitle: 'ዋና ቀመር',
    icon: 'FunctionSquare',
    borderClass: 'border-indigo-500/40',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    badgeClass: 'bg-indigo-500 text-white',
    textClass: 'text-indigo-400'
  }
};
