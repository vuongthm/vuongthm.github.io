export const aiProviders = {
  gemini: {
    label: "Google Gemini",
    model: "gemini-3.5-flash-lite",
    keys: "https://aistudio.google.com/apikey",
    docs: "https://ai.google.dev/gemini-api/docs",
  },
  openai: {
    label: "OpenAI / ChatGPT",
    model: "gpt-6-astra",
    keys: "https://platform.openai.com/api-keys",
    docs: "https://developers.openai.com/api/docs/guides/text",
  },
  anthropic: {
    label: "Anthropic / Claude",
    model: "claude-haiku-5-5",
    keys: "https://platform.claude.com/settings/keys",
    docs: "https://platform.claude.com/docs/en/api/messages/create",
  },
  xai: {
    label: "xAI / Grok",
    model: "grok-4.7",
    keys: "https://console.x.ai/",
    docs: "https://docs.x.ai/developers/rest-api-reference/inference/responses",
  },
} as const
export type AIProvider = keyof typeof aiProviders
export type AIProfile = { key: string; model: string }
export type AIProfiles = Record<AIProvider, AIProfile>
export function initialProfiles(): AIProfiles {
  return Object.fromEntries(
    Object.entries(aiProviders).map(([id, value]) => [id, { key: "", model: value.model }]),
  ) as AIProfiles
}
