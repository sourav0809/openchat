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
    default: "google/gemini-2.0-flash",
    reasoning: "google/gemini-2.0-flash",
  },
} as const;

// Environment variable configuration
export const LLM_ENV_VARS = {
  [LLMProvider.OPENAI]: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL,
  },
  [LLMProvider.GEMINI]: {
    apiKey:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
    baseUrl: process.env.GEMINI_BASE_URL,
  },
} as const;

// Default configuration
export const DEFAULT_LLM_CONFIG = {
  provider: LLMProvider.GEMINI,
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
} as const;

// Model mapping for direct provider usage
export const MODEL_MAPPING = {
  [LLMProvider.OPENAI]: {
    "openai/gpt-4o": "gpt-4o",
    "openai/gpt-4o-mini": "gpt-4o-mini",
  },
  [LLMProvider.GEMINI]: {
    "google/gemini-2.0-flash": "models/gemini-2.0-flash-exp",
    "google/gemini-1.5-pro": "models/gemini-1.5-pro",
    "google/gemini-1.5-flash": "models/gemini-1.5-flash",
  },
} as const;
