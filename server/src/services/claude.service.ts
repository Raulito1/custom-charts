import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeQueryResponse } from '../types';
import { getSchema, buildSystemPrompt } from './schema.service';
import { isSnowflakeConfigured } from './snowflake.service';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callClaude(question: string): Promise<ClaudeQueryResponse> {
  const anthropic = getClient();

  const tables = await getSchema();
  const dialect = isSnowflakeConfigured() ? 'snowflake' : 'alasql';
  const systemPrompt = buildSystemPrompt(tables, dialect);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Question: ${question}\n\nGenerate the SQL and chart configuration.`,
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();

  try {
    return JSON.parse(raw) as ClaudeQueryResponse;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ClaudeQueryResponse;
    throw new Error(`Claude returned unparseable response: ${raw.slice(0, 300)}`);
  }
}
