import * as React from "react";
import Link from "next/link";
import { BossAddressingDecisionTree } from "@/components/blog/BossAddressingDecisionTree";
import { BossInvitationEtiquetteTimeline } from "@/components/blog/BossInvitationEtiquetteTimeline";
import { BossZaloTemplatesCard } from "@/components/blog/BossZaloTemplatesCard";
import { GroomCardLayoutDiagram } from "@/components/blog/GroomCardLayoutDiagram";
import { GroomSpecialFamilyCases } from "@/components/blog/GroomSpecialFamilyCases";
import { GroomVsBrideComparisonCard } from "@/components/blog/GroomVsBrideComparisonCard";
import { InviteChannelDecisionCard } from "@/components/blog/InviteChannelDecisionCard";
import { KinshipPrefixMatrix } from "@/components/blog/KinshipPrefixMatrix";
import { SalutationHierarchyFlow } from "@/components/blog/SalutationHierarchyFlow";
import { SalutationMistakeSplit } from "@/components/blog/SalutationMistakeSplit";
import { TextInviteCadenceTimeline } from "@/components/blog/TextInviteCadenceTimeline";
import { TextingEtiquettePitfalls } from "@/components/blog/TextingEtiquettePitfalls";
import { slugifyHeading } from "@/lib/blog";

const BLOG_VISUAL_COMPONENTS: Record<string, React.ComponentType> = {
  SalutationHierarchyFlow,
  KinshipPrefixMatrix,
  SalutationMistakeSplit,
  BossAddressingDecisionTree,
  BossInvitationEtiquetteTimeline,
  BossZaloTemplatesCard,
  GroomCardLayoutDiagram,
  GroomVsBrideComparisonCard,
  GroomSpecialFamilyCases,
  InviteChannelDecisionCard,
  TextInviteCadenceTimeline,
  TextingEtiquettePitfalls,
};

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${tokenIndex++}`;

    if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const href = linkMatch[2].trim();
        const isInternal = href.startsWith("/") || href.startsWith("#");
        if (isInternal) {
          nodes.push(
            <Link
              key={key}
              href={href}
              className="font-medium text-accent-text underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
            >
              {label}
            </Link>,
          );
        } else {
          nodes.push(
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-text underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
            >
              {label}
            </a>,
          );
        }
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded border border-border bg-surface-alt px-1.5 py-0.5 text-[0.9em] text-text"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-text">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function isBlockStart(line: string): boolean {
  const t = line.trim();
  return (
    t === "" ||
    t.startsWith("```") ||
    /^#{1,4}\s+/.test(t) ||
    /^[-*_]{3,}$/.test(t) ||
    /^>\s?/.test(t) ||
    /^[-*]\s+/.test(t) ||
    /^\d+\.\s+/.test(t) ||
    /^!\[[^\]]*\]\([^)]+\)$/.test(t) ||
    t.startsWith("|")
  );
}

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      elements.push(
        <pre
          key={`code-${blockKey++}`}
          className="my-5 overflow-x-auto rounded-xl border border-border bg-surface-alt p-4 text-xs leading-relaxed text-text sm:text-sm"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${blockKey++}`} className="my-8 border-border" />,
      );
      i += 1;
      continue;
    }

    // Embedded bespoke blog visual component tags
    const jsxTagMatch = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\s*\/>$/);
    if (jsxTagMatch) {
      const VisualComponent = BLOG_VISUAL_COMPONENTS[jsxTagMatch[1]];
      if (VisualComponent) {
        elements.push(<VisualComponent key={`visual-${blockKey++}`} />);
        i += 1;
        continue;
      }
    }

    // DispatchSEO hidden signature tag
    const sigMatch = trimmed.match(/^<span\s+data-dispatchseo="([^"]+)"\s+hidden><\/span>$/);
    if (sigMatch) {
      elements.push(
        <span key={`sig-${blockKey++}`} data-dispatchseo={sigMatch[1]} hidden />,
      );
      i += 1;
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const rawText = headingMatch[2];
      const key = `h-${blockKey++}`;

      if (level === 2) {
        const plain = rawText.replace(/[*_`]/g, "").trim();
        const baseId = slugifyHeading(plain) || "section";
        const count = usedIds.get(baseId) ?? 0;
        usedIds.set(baseId, count + 1);
        const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
        elements.push(
          <h2
            key={key}
            id={id}
            className="mt-10 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl"
          >
            {renderInline(rawText, key)}
          </h2>,
        );
      } else if (level === 3) {
        elements.push(
          <h3
            key={key}
            className="mt-7 font-display text-xl font-semibold text-text"
          >
            {renderInline(rawText, key)}
          </h3>,
        );
      } else {
        elements.push(
          <h4 key={key} className="mt-5 text-base font-semibold text-text">
            {renderInline(rawText, key)}
          </h4>,
        );
      }
      i += 1;
      continue;
    }

    // Standalone image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      elements.push(
        <figure key={`img-${blockKey++}`} className="my-6">
          <img
            src={imgMatch[2].trim()}
            alt={imgMatch[1]}
            className="w-full rounded-2xl border border-border bg-surface object-cover"
          />
          {imgMatch[1] && (
            <figcaption className="mt-2 text-center text-xs text-text-muted">
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>,
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      const key = `bq-${blockKey++}`;
      elements.push(
        <blockquote
          key={key}
          className="my-5 rounded-r-xl border-l-2 border-accent bg-surface px-4 py-3 text-sm leading-relaxed text-text-muted sm:text-base"
        >
          {renderInline(quoteLines.join(" "), key)}
        </blockquote>,
      );
      continue;
    }

    // Markdown table
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1].trim())
    ) {
      const parseRow = (row: string) =>
        row
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());

      const headers = parseRow(lines[i]);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      const key = `tbl-${blockKey++}`;
      elements.push(
        <div
          key={key}
          className="my-6 overflow-x-auto rounded-xl border border-border bg-surface"
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={`${key}-h-${idx}`}
                    className="px-4 py-2.5 font-semibold text-text"
                  >
                    {renderInline(header, `${key}-h-${idx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, rIdx) => (
                <tr key={`${key}-r-${rIdx}`}>
                  {headers.map((_, cIdx) => (
                    <td
                      key={`${key}-c-${rIdx}-${cIdx}`}
                      className="px-4 py-2.5 text-text-muted"
                    >
                      {renderInline(row[cIdx] ?? "", `${key}-c-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      const key = `ul-${blockKey++}`;
      elements.push(
        <ul
          key={key}
          className="my-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-text-muted sm:text-base"
        >
          {items.map((item, idx) => (
            <li key={`${key}-${idx}`}>{renderInline(item, `${key}-${idx}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      const key = `ol-${blockKey++}`;
      elements.push(
        <ol
          key={key}
          className="my-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-text-muted sm:text-base"
        >
          {items.map((item, idx) => (
            <li key={`${key}-${idx}`}>{renderInline(item, `${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (i < lines.length && !isBlockStart(lines[i])) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    if (paraLines.length > 0) {
      const key = `p-${blockKey++}`;
      elements.push(
        <p
          key={key}
          className="my-4 text-sm leading-7 text-text-muted sm:text-base"
        >
          {renderInline(paraLines.join(" "), key)}
        </p>,
      );
    } else {
      i += 1;
    }
  }

  return <div className="space-y-1">{elements}</div>;
}
