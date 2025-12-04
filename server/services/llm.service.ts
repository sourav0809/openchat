import { generateText, ModelMessage, LanguageModel, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { tools } from "../llm/tools";
import { z } from "zod";
import {
  LLMProvider,
  MODEL_CONFIGS,
  LLM_ENV_VARS,
  DEFAULT_LLM_CONFIG,
  MODEL_MAPPING,
} from "../constants/llm.constants";
import { TOOL_CONFIG } from "server/constants/chat.constants";

// LLM configuration schema
const LLMConfigSchema = z.object({
  provider: z.nativeEnum(LLMProvider).default(DEFAULT_LLM_CONFIG.provider),
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// Invoke options
export interface InvokeOptions {
  messages: ModelMessage[];
  useTools?: boolean;
}

// getLlm options
export interface GetLlmOptions {
  forReasoning?: boolean;
  maxTokens?: number;
  temperature?: number; // Used by getLlm method
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = LLMConfigSchema.parse(config);

    // Validate environment variables
    this.validateEnvironment();
  }

  /**
   * Validate that required environment variables are set
   */
  private validateEnvironment(): void {
    const envVars = LLM_ENV_VARS[this.config.provider];

    if (!envVars.apiKey) {
      const envVarName =
        this.config.provider === LLMProvider.GEMINI
          ? "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY"
          : `${this.config.provider.toUpperCase()}_API_KEY`;

      throw new Error(
        `Missing API key for ${this.config.provider}. ` +
          `Please set ${envVarName} environment variable.`
      );
    }
  }

  /**
   * Update LLM service configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = LLMConfigSchema.parse({ ...this.config, ...config });
    this.validateEnvironment(); // Re-validate after config change
  }

  /**
   * Private method to get/configure LLM model with options
   */
  private getLlm(options: GetLlmOptions = {}): {
    model: LanguageModel; // LanguageModel instance from provider
    temperature: number;
    maxTokens?: number;
  } {
    const models = MODEL_CONFIGS[this.config.provider];
    const modelKey = options.forReasoning ? models.reasoning : models.default;

    // Get the mapped model name for the provider
    const providerModels = MODEL_MAPPING[this.config.provider];
    const mappedModelName =
      providerModels[modelKey as keyof typeof providerModels];

    // Create the model instance based on provider
    let modelInstance: LanguageModel;
    if (this.config.provider === LLMProvider.OPENAI) {
      modelInstance = openai(mappedModelName);
    } else if (this.config.provider === LLMProvider.GEMINI) {
      modelInstance = google(mappedModelName);
    } else {
      // Fallback to OpenAI if provider is not recognized
      modelInstance = openai("gpt-4o");
    }

    return {
      model: modelInstance,
      temperature: options.temperature ?? DEFAULT_LLM_CONFIG.temperature,
      maxTokens: options.maxTokens,
    };
  }

  /**
   * Invoke LLM with messages and options
   */
  async invoke(options: InvokeOptions): Promise<{
    text: string;
    toolCalls: unknown[];
    toolResults: unknown[];
  }> {
    const llmConfig = this.getLlm();

    const result = await generateText({
      model: llmConfig.model, // This is now a LanguageModel instance
      messages: options.messages,
      temperature: llmConfig.temperature,
      tools: options.useTools ? tools : {},
      stopWhen: stepCountIs(TOOL_CONFIG.MAX_STEPS),
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls || [],
      toolResults: result.toolResults || [],
    };
  }

  /**
   * Generate text without tools
   * @param prompt - The prompt to generate text for
   * @returns The generated text
   */
  async generateText(prompt: string): Promise<string> {
    const messages: ModelMessage[] = [{ role: "user", content: prompt }];

    const result = await this.invoke({
      messages,
      useTools: false,
    });

    return result.text;
  }

  /**
   *
   * @param prompt - The prompt to generate text for
   * @param options - The options for the LLM
   * @returns The generated text
   */
  async generateTextWithOptions(
    prompt: string,
    options: GetLlmOptions & { useTools?: boolean }
  ): Promise<{
    text: string;
    toolCalls: unknown[];
    toolResults: unknown[];
  }> {
    const messages: ModelMessage[] = [{ role: "user", content: prompt }];
    const llmConfig = this.getLlm(options);

    const result = await generateText({
      model: llmConfig.model, // This is now a LanguageModel instance
      messages,
      temperature: llmConfig.temperature,
      tools: options.useTools ? tools : {},
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls || [],
      toolResults: result.toolResults || [],
    };
  }

  /**
   * Get the current provider
   * @returns The current provider
   */
  getProvider(): LLMProvider {
    return this.config.provider;
  }
}

export const llmService = new LLMService();
