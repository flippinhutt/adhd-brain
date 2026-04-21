// Goblin.tools-style AI features

import { aiComplete } from './provider'

// Break a task into smaller subtasks
export async function breakTask(taskTitle: string, context?: string): Promise<string[]> {
  const prompt = `You are a task breakdown assistant for someone with ADHD.
Break this task into 3-7 very small, concrete, actionable steps.
Each step should take 5-15 minutes.
Return ONLY a JSON array of strings. No explanation.

Task: ${taskTitle}${context ? `\nContext: ${context}` : ''}`

  const raw = await aiComplete(prompt)
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return [raw]
  return JSON.parse(match[0]) as string[]
}

// Estimate time for a task in minutes
export async function estimateTime(taskTitle: string): Promise<number> {
  const prompt = `You are a time estimation assistant.
Estimate how many minutes this task will realistically take for someone with ADHD (add 50% buffer).
Return ONLY a single integer (minutes). No explanation.

Task: ${taskTitle}`

  const raw = await aiComplete(prompt)
  const num = parseInt(raw.trim(), 10)
  return isNaN(num) ? 30 : num
}

// Change tone of text (formal / casual / gentle / direct)
export async function formalize(text: string, tone: 'formal' | 'casual' | 'gentle' | 'direct'): Promise<string> {
  const toneMap = {
    formal: 'professional and formal',
    casual: 'casual and friendly',
    gentle: 'gentle and kind',
    direct: 'direct and concise',
  }
  const prompt = `Rewrite the following text in a ${toneMap[tone]} tone.
Return ONLY the rewritten text. No explanation.

Text: ${text}`

  return aiComplete(prompt)
}

// Convert brain dump into sorted tasks
export async function brainDump(rawText: string): Promise<Array<{ title: string; priority: 'urgent' | 'high' | 'normal' | 'low' }>> {
  const prompt = `You are a task extraction assistant for someone with ADHD.
Extract tasks from this brain dump text.
Assign each a priority: urgent, high, normal, or low.
Return ONLY a JSON array of objects with "title" and "priority" fields. No explanation.

Brain dump:
${rawText}`

  const raw = await aiComplete(prompt)
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return []
  return JSON.parse(match[0])
}

// Summarize a task description
export async function summarize(text: string): Promise<string> {
  const prompt = `Summarize this in one short sentence (max 15 words). Return ONLY the summary.

Text: ${text}`
  return aiComplete(prompt)
}
