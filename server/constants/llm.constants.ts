// Provider configuration
export enum LLMProvider {
  OPENAI = "openai",
  GEMINI = "gemini",
}

// Model configurations
export const MODEL_CONFIGS = {
  [LLMProvider.OPENAI]: {
    default: "openai/gpt-4o",
    reasoning: "openai/gpt-4o-mini",
  },
  [LLMProvider.GEMINI]: {
    default: "google/gemini-1.5-pro",
    reasoning: "google/gemini-1.5-flash",
  },
} as const;

// Environment variable configuration
export const LLM_ENV_VARS = {
  [LLMProvider.OPENAI]: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
  },
  [LLMProvider.GEMINI]: {
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: process.env.GEMINI_BASE_URL,
  },
} as const;

// Default configuration
export const DEFAULT_LLM_CONFIG = {
  provider: LLMProvider.OPENAI,
  temperature: 0.7,
} as const;
