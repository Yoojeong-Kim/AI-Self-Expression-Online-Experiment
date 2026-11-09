export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  text: string;
  keyUsedIndex: number;
  modelUsed: string;
}

// 1. Gather all available OpenAI API keys from environment variables
export function getOpenAIKeys(): string[] {
  const keys: string[] = [];

  // Comma-separated list: OPENAI_API_KEYS="sk-...,sk-...,sk-..."
  if (process.env.OPENAI_API_KEYS) {
    const split = process.env.OPENAI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
    keys.push(...split);
  }

  // Numbered variables: OPENAI_API_KEY_1, OPENAI_API_KEY_2, OPENAI_API_KEY_3, ...
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`OPENAI_API_KEY_${i}`];
    if (k && k.trim() && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }

  // Single default variable: OPENAI_API_KEY
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    const single = process.env.OPENAI_API_KEY.trim();
    if (!keys.includes(single)) {
      keys.push(single);
    }
  }

  return keys;
}

// Global rotation counter initialized with random offset per container
let globalCounter = Math.floor(Math.random() * 100);

/**
 * Calls OpenAI Chat Completions with multi-key round-robin load balancing and automatic failover.
 * - Distributes traffic evenly across available keys (1 -> 2 -> 3 -> 1 -> 2 -> 3).
 * - If any key hits a Rate Limit (429) or temporary error, it instantly retries using the next key.
 */
export async function callOpenAIWithRotation(
  messages: OpenAIMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }
): Promise<OpenAIResponse | null> {
  const keys = getOpenAIKeys();
  if (keys.length === 0) {
    return null;
  }

  const model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = options?.temperature ?? 0.75;
  const maxTokens = options?.maxTokens ?? 500;
  const timeoutMs = options?.timeoutMs ?? 10000;

  // Strict round-robin across available keys
  const startIndex = (globalCounter++) % keys.length;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const currentIndex = (startIndex + attempt) % keys.length;
    const apiKey = keys[currentIndex];

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          return {
            text: content,
            keyUsedIndex: currentIndex + 1,
            modelUsed: model,
          };
        }
      } else {
        const errBody = await res.text().catch(() => '');
        console.warn(
          `[OpenAI Rotation] Key #${currentIndex + 1} failed with HTTP ${res.status}: ${errBody.slice(0, 150)}. Trying next key...`
        );
      }
    } catch (err: any) {
      console.warn(
        `[OpenAI Rotation] Key #${currentIndex + 1} request error: ${err?.message || err}. Trying next key...`
      );
    }
  }

  console.error('[OpenAI Rotation] All configured OpenAI keys failed or timed out.');
  return null;
}
