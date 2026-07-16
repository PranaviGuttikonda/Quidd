import { Category, Mood } from '@/types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface ParsedExpense {
  amount: number;
  category: Category;
  description: string;
  note?: string;
}

interface MonthlySummary {
  summary: string;
  savingsTip: string;
  topInsight: string;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function geminiRequest(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Parse natural language expense ──────────────────────────────────────────

export async function parseExpenseFromText(input: string): Promise<ParsedExpense> {
  const prompt = `
You are an expense parser for an Indian expense tracker app called Quidd.
The user types naturally in English or Hinglish.

Parse the following input and return ONLY valid JSON (no markdown, no explanation):
{
  "amount": <number in INR>,
  "category": <one of: food, travel, shopping, health, entertainment, bills, savings, other>,
  "description": <short 2-4 word label>,
  "note": <optional extra context, or null>
}

Categories guide:
- food: restaurants, groceries, snacks, chai, delivery
- travel: uber, auto, bus, train, petrol, flight
- shopping: clothes, electronics, amazon, flipkart
- health: medicine, gym, doctor, pharmacy
- entertainment: movies, netflix, spotify, games
- bills: rent, electricity, wifi, recharge
- savings: money saved, investment, fd

Input: "${input}"

Return only the JSON object.
`.trim();

  const raw = await geminiRequest(prompt);

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      amount: Number(parsed.amount) || 0,
      category: (parsed.category as Category) || 'other',
      description: parsed.description || input,
      note: parsed.note ?? undefined,
    };
  } catch {
    return { amount: 0, category: 'other', description: input };
  }
}

// ─── Daily AI tip ─────────────────────────────────────────────────────────────

export async function getDailyTip(totalSpent: number, topCategory: string): Promise<string> {
  const prompt = `
You are Quiddy, a friendly and witty financial assistant for young Indians.
The user has spent ₹${totalSpent} this month, mostly on ${topCategory}.
Give ONE short, punchy tip (max 20 words). Be encouraging, not preachy.
No hashtags, no emojis, just the tip text.
`.trim();

  return (await geminiRequest(prompt)).trim();
}

// ─── Monthly AI summary ───────────────────────────────────────────────────────

export async function getMonthlySummary(
  month: string,
  totalSpent: number,
  breakdown: Record<string, number>
): Promise<MonthlySummary> {
  const breakdownText = Object.entries(breakdown)
    .map(([cat, amt]) => `${cat}: ₹${amt}`)
    .join(', ');

  const prompt = `
You are Quiddy, a friendly financial assistant for young Indians.
Month: ${month}
Total spent: ₹${totalSpent}
Breakdown: ${breakdownText}

Return ONLY valid JSON (no markdown):
{
  "summary": "<2 sentence friendly summary of the month>",
  "savingsTip": "<1 actionable saving tip for next month, max 20 words>",
  "topInsight": "<1 interesting observation about their spending, max 20 words>"
}
`.trim();

  const raw = await geminiRequest(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: 'Great job tracking your expenses this month!',
      savingsTip: 'Try setting a daily spending limit to save more.',
      topInsight: 'You are doing better than most people your age.',
    };
  }
}

// ─── Smart budget suggestion ──────────────────────────────────────────────────

export async function suggestBudgets(
  avgSpending: Record<string, number>
): Promise<Record<string, number>> {
  const spendingText = Object.entries(avgSpending)
    .map(([cat, amt]) => `${cat}: ₹${amt}/month avg`)
    .join(', ');

  const prompt = `
You are a budgeting assistant for a young Indian professional.
Based on their average monthly spending: ${spendingText}

Suggest reasonable monthly budget limits for each category.
Return ONLY valid JSON (no markdown), same categories as input, values in INR.
Example: { "food": 5000, "travel": 2000 }
`.trim();

  const raw = await geminiRequest(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}