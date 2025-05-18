/* ------------------------------------------------------------------
 * Claude–LaTeX MCP ‑ Equation Generator  (uses math-symbols-library)
 * ------------------------------------------------------------------ */

import { Claude } from '@anthropic/sdk';
import type { ExecuteToolResponseSchema } from '@anthropic-ai/mcp-typescript-sdk';
import { isValidCommand } from './math-symbols-library';

/* ------------------------------------------------------------------
 * 1.  Claude client
 * ------------------------------------------------------------------ */
const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY ?? ''
});

/* ------------------------------------------------------------------ */
export interface EquationGenerationParams {
  description: string;
  format: 'inline' | 'display' | 'align' | 'gather' | 'multline';
  numbered: boolean;
  additionalContext?: string;
  model?: string;
}

export interface EquationGenerationResult {
  latex: string;
  preview: string;
  components?: string[];
  explanation?: string;
}

/* ------------------------------------------------------------------ */
export async function generateEquation(
  params: EquationGenerationParams
): Promise<ExecuteToolResponseSchema> {
  const { description, format, numbered, additionalContext = '', model } = params;

  const cached = matchKnownEquationPattern(description);
  if (cached) return formatEquationResult(cached, format, numbered);

  const aiRes = await generateEquationWithClaude(description, additionalContext, model);
  return formatEquationResult(aiRes, format, numbered);
}

/* ------------------------------------------------------------------ *\
 * Fast‑path patterns (shortened for brevity – extend as needed)
\* ------------------------------------------------------------------ */
function matchKnownEquationPattern(desc: string): EquationGenerationResult | null {
  const lower = desc.toLowerCase();

  const patterns: { keys: string[]; latex: string; explanation: string }[] = [
    {
      keys: ['quadratic formula'],
      latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      explanation: 'Solution to ax²+bx+c=0.'
    },
    {
      keys: ['pythagorean theorem'],
      latex: 'a^2 + b^2 = c^2',
      explanation: 'Right‑triangle side relation.'
    },
    {
      keys: ['euler identity', "euler's identity"],
      latex: 'e^{i\\pi} + 1 = 0',
      explanation: 'Links e, i, π, 1, 0.'
    }
  ];

  for (const { keys, latex, explanation } of patterns) {
    if (keys.some(k => lower.includes(k)))
      return {
        latex,
        preview: `Preview:\n${latex}`,
        explanation
      };
  }

  return null;
}

/* ------------------------------------------------------------------ */
async function generateEquationWithClaude(
  description: string,
  additionalContext: string,
  model?: string
): Promise<EquationGenerationResult> {
  const prompt = `
You are a LaTeX expert. Produce ONLY the raw LaTeX expression
(no \\begin, no $) on the first line, then a blank line,
then "Explanation: ..." in one sentence.

Description: ${description}
${additionalContext ? `Context: ${additionalContext}` : ''}
`;

  const res = await claude.messages.create({
    model: model ?? process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-20240620',
    system: 'Strictly follow the output spec.',
    temperature: 0.1,
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = res.content[0].text.trim();
  const [latexLine, ...rest] = text.split('\n').filter(Boolean);
  const latex = latexLine
    .replace(/^\$+|\$+$/g, '')
    .replace(/```latex|```/g, '')
    .trim();

  const explanation = rest.join('\n').replace(/^Explanation:\s*/i, '').trim();

  return { latex, preview: `Preview:\n${latex}`, explanation };
}

/* ------------------------------------------------------------------ */
function formatEquationResult(
  src: EquationGenerationResult,
  fmt: EquationGenerationParams['format'],
  numbered: boolean
): ExecuteToolResponseSchema {
  const wrap = (() => {
    switch (fmt) {
      case 'inline':
        return `$${src.latex}$`;
      case 'display':
        return numbered
          ? `\\begin{equation}\n  ${src.latex}\n\\end{equation}`
          : `\\[\n  ${src.latex}\n\\]`;
      case 'align':
        return numbered
          ? `\\begin{align}\n  ${src.latex}\n\\end{align}`
          : `\\begin{align*}\n  ${src.latex}\n\\end{align*}`;
      case 'gather':
        return numbered
          ? `\\begin{gather}\n  ${src.latex}\n\\end{gather}`
          : `\\begin{gather*}\n  ${src.latex}\n\\end{gather*}`;
      case 'multline':
        return numbered
          ? `\\begin{multline}\n  ${src.latex}\n\\end{multline}`
          : `\\begin{multline*}\n  ${src.latex}\n\\end{multline*}`;
      default:
        return src.latex;
    }
  })();

  return {
    result: {
      latex: wrap,
      preview: src.preview,
      components: src.components,
      explanation: src.explanation
    }
  };
}

/* ------------------------------------------------------------------ */
export function validateEquation(code: string): string[] {
  const errs: string[] = [];

  const open = (code.match(/\{/g) || []).length;
  const close = (code.match(/\}/g) || []).length;
  if (open !== close) errs.push(`Unbalanced braces (${open}/${close}).`);

  const dollars = (code.match(/\$/g) || []).length;
  if (dollars % 2) errs.push('Unbalanced $ delimiters.');

  const begin = code.match(/\\begin\{([^}]+)\}/g) || [];
  const end = code.match(/\\end\{([^}]+)\}/g) || [];
  if (begin.length !== end.length)
    errs.push(`Mismatched \\begin/\\end (${begin.length}/${end.length}).`);

  for (const cmd of code.match(/\\[a-zA-Z]+/g) || []) {
    const name = cmd.substring(1);
    if (!isValidCommand(name)) errs.push(`Unknown command \\${name}`);
  }
  return errs;
}
