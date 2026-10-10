const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
// Tried in order when the main model is overloaded or rate-limited.
const FALLBACKS = [MODEL, 'gemini-flash-lite-latest'];

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const retryable = (status: number) => status === 429 || status === 500 || status === 503;

/**
 * POSTs to generateContent, retrying once per model and falling back to a
 * lighter model when Gemini reports high demand. The key never leaves the server.
 */
export async function geminiGenerate(body: object): Promise<{ data: any; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured.');
  let lastError = 'Gemini request failed.';
  for (const model of [...new Set(FALLBACKS)]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
        });
        const data: any = await res.json().catch(() => ({}));
        if (res.ok) return { data, model };
        lastError = data?.error?.message || `Gemini request failed (${res.status}).`;
        if (!retryable(res.status)) throw new Error(lastError);
      } catch (e: any) {
        if (e?.name !== 'AbortError' && !String(e?.message).includes('fetch')) throw e;
        lastError = 'Gemini did not respond in time.';
      } finally {
        clearTimeout(timer);
      }
      await sleep(600 * (attempt + 1));
    }
  }
  throw new Error(lastError);
}

/** Returns parsed JSON matching `schema`. */
export async function geminiJson<T>(systemText: string, userText: string, schema: object): Promise<T> {
  const { data } = await geminiGenerate({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: schema },
  });
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('');
  if (!text) throw new Error('Gemini returned an empty response.');
  return JSON.parse(text) as T;
}

export const geminiModelName = MODEL;
