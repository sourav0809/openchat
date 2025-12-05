import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

// Provider configuration
export enum LLMProvider {
  OPENAI = "openai",
  GEMINI = "gemini",
}

/**
 *
 * @param provider - The provider to use
 * @returns The LLM configuration
 */
export function getLlmConfig(provider: string = "GEMINI") {
  if (provider === "OPENAI") {
    return {
      model: openai("gpt-4o"),
      temperature: 0.7,
      apiKeyRequired: "OPENAI_API_KEY",
      name: "OpenAI",
    } as const;
  } else {
    // Default to GEMINI
    return {
      model: google("gemini-2.0-flash"),
      temperature: 0.7,
      apiKeyRequired: "GOOGLE_GENERATIVE_AI_API_KEY",
      name: "Gemini",
    } as const;
  }
}

// LLM Provider configuration based on environment
export const LLM_CONFIG = getLlmConfig(process.env.LLM_PROVIDER);
