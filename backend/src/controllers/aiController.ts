import { Response } from 'express';
import { AuthRequest } from '../middleware';
import { config } from '../config';

export interface ParsedTicketSuggestion {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
}

const SYSTEM_PROMPT = `You are a helpful assistant that turns a user's short request into a structured support ticket.
Given the user's message, respond with a JSON object only (no markdown, no code fence) with these exact keys:
- title: string (short subject, max ~80 chars)
- description: string (full details, can be multiple sentences)
- priority: one of "low" | "medium" | "high" | "urgent" (infer from words like urgent, critical, ASAP = high/urgent; normal = medium; minor = low)
- category: string (suggest one category name that might exist in a ticketing system, e.g. "Hardware", "Network", "Software", "Fire Safety", "Electrical", "HVAC", "Maintenance", "General")

If the user message is vague, use sensible defaults. Priority default is "medium". Category default is "General".`;

function extractJson(text: string): ParsedTicketSuggestion | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const title = typeof parsed.title === 'string' ? parsed.title : '';
    const description = typeof parsed.description === 'string' ? parsed.description : trimmed;
    const priority = ['low', 'medium', 'high', 'urgent'].includes(String(parsed.priority))
      ? (parsed.priority as ParsedTicketSuggestion['priority'])
      : 'medium';
    const category = typeof parsed.category === 'string' ? parsed.category : 'General';
    return { title: title || description?.slice(0, 80) || 'Support request', description, priority, category };
  } catch {
    return null;
  }
}

export async function parseTicketPrompt(req: AuthRequest, res: Response): Promise<void> {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required (string)' });
    return;
  }

  if (!config.openaiApiKey) {
    res.status(503).json({
      error: 'AI assist is not configured. Set OPENAI_API_KEY in the server environment.',
      fallback: { title: prompt.slice(0, 80), description: prompt, priority: 'medium', category: 'General' },
    });
    return;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt.trim() },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(502).json({
        error: 'No response from AI',
        fallback: { title: prompt.slice(0, 80), description: prompt, priority: 'medium', category: 'General' },
      });
      return;
    }

    const suggestion = extractJson(content);
    if (suggestion) {
      res.json(suggestion);
      return;
    }

    res.json({
      title: prompt.slice(0, 80) || 'Support request',
      description: prompt,
      priority: 'medium' as const,
      category: 'General',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    console.error('[ai] parseTicketPrompt error:', message);
    res.status(502).json({
      error: message,
      fallback: { title: prompt.slice(0, 80), description: prompt, priority: 'medium' as const, category: 'General' },
    });
  }
}

export interface ParsedReportSuggestion {
  status?: string;
  assignedToName?: string;
  dateFrom?: string;
  dateTo?: string;
  zone?: string;
}

const REPORT_SYSTEM_PROMPT = `You are a helpful assistant that turns a user's report request into structured filters.
Given the user's message (e.g. "open tickets from John from 1 Jan to 31 Jan", "report of closed tickets between March 1 and March 15"),
respond with a JSON object only (no markdown, no code fence) with these exact keys:
- status: string, one of "open" | "in-progress" | "on-hold" | "resolved" | "closed" or empty if not specified (infer: "open tickets" -> "open", "closed" -> "closed", "all" or unspecified -> omit)
- assignedToName: string, name of the person (assignee or creator) if mentioned, e.g. "John", "John Doe"; empty or omit if not specified
- dateFrom: string, ISO date only (YYYY-MM-DD) for start of range if mentioned; omit if not specified
- dateTo: string, ISO date only (YYYY-MM-DD) for end of range if mentioned; omit if not specified
- zone: string, zone name if mentioned; omit if not specified

Use today's date to resolve relative dates like "last week". If only one date is given, use it as dateTo (end date) and leave dateFrom empty, or as both if it's a single-day report.`;

function extractReportJson(text: string): ParsedReportSuggestion | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      status: typeof parsed.status === 'string' ? parsed.status : undefined,
      assignedToName: typeof parsed.assignedToName === 'string' ? parsed.assignedToName : undefined,
      dateFrom: typeof parsed.dateFrom === 'string' ? parsed.dateFrom : undefined,
      dateTo: typeof parsed.dateTo === 'string' ? parsed.dateTo : undefined,
      zone: typeof parsed.zone === 'string' ? parsed.zone : undefined,
    };
  } catch {
    return null;
  }
}

export async function parseReportPrompt(req: AuthRequest, res: Response): Promise<void> {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt is required (string)' });
    return;
  }

  if (!config.openaiApiKey) {
    res.status(503).json({
      error: 'AI report parsing is not configured.',
      fallback: {},
    });
    return;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const today = new Date().toISOString().slice(0, 10);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: REPORT_SYSTEM_PROMPT + `\nToday's date is ${today}.` },
        { role: 'user', content: prompt.trim() },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: 'No response from AI', fallback: {} });
      return;
    }

    const suggestion = extractReportJson(content);
    if (suggestion) {
      res.json(suggestion);
      return;
    }
    res.json({});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    console.error('[ai] parseReportPrompt error:', message);
    res.status(502).json({ error: message, fallback: {} });
  }
}
