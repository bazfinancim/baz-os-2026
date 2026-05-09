type AiProvider = "anthropic" | "gemini";

type AiRouteRequest = {
  prompt: string;
  provider?: AiProvider;
  system?: string;
};

type AiRouteResponse = {
  provider: AiProvider;
  text: string;
};

function resolveProvider(requestedProvider?: AiProvider): AiProvider {
  if (requestedProvider) {
    return requestedProvider;
  }

  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "gemini";
}

async function routeAnthropic(prompt: string, system?: string): Promise<AiRouteResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const text = data.content?.find((item) => item.type === "text")?.text ?? "";

  return { provider: "anthropic", text };
}

async function routeGemini(prompt: string, system?: string): Promise<AiRouteResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return { provider: "gemini", text };
}

export async function routeAiPrompt({
  prompt,
  provider,
  system,
}: AiRouteRequest): Promise<AiRouteResponse> {
  if (!prompt.trim()) {
    throw new Error("Prompt is required");
  }

  const selectedProvider = resolveProvider(provider);

  try {
    if (selectedProvider === "anthropic") {
      return await routeAnthropic(prompt, system);
    }

    return await routeGemini(prompt, system);
  } catch (error) {
    if (selectedProvider === "anthropic" && process.env.GEMINI_API_KEY) {
      return routeGemini(prompt, system);
    }

    if (selectedProvider === "gemini" && process.env.ANTHROPIC_API_KEY) {
      return routeAnthropic(prompt, system);
    }

    throw error;
  }
}
