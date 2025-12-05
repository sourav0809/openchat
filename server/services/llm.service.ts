import {
  generateText,
  streamText,
  ModelMessage,
  LanguageModel,
  stepCountIs,
} from "ai";
import { tools } from "../llm/tools";
import { TOOL_CONFIG } from "../constants/chat.constants";
import { LLM_CONFIG, SYSTEM_PROMPT } from "../constants/llm.constants";

// Invoke options
export interface InvokeOptions {
  messages: ModelMessage[];
  useTools?: boolean;
}

export class LLMService {
  constructor() {
    this.validateEnvironment();
  }

  /**
   * Validate that required environment variables are set
   */
  private validateEnvironment(): void {
    const apiKey = process.env[LLM_CONFIG.apiKeyRequired];
    if (!apiKey) {
      throw new Error(
        `Missing ${LLM_CONFIG.name} API key. Please set ${LLM_CONFIG.apiKeyRequired} environment variable.`
      );
    }
  }

  /**
   * Get configured model
   */
  private getModel(): LanguageModel {
    return LLM_CONFIG.model;
  }

  /**
   * Get temperature setting
   */
  private getTemperature(): number {
    return LLM_CONFIG.temperature;
  }

  /**
   * Invoke LLM with messages and options (non-streaming)
   */
  async invoke(options: InvokeOptions): Promise<{
    text: string;
    toolCalls: unknown[];
    toolResults: unknown[];
  }> {
    const messagesWithSystem: ModelMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...options.messages,
    ];

    const result = await generateText({
      model: this.getModel(),
      messages: messagesWithSystem,
      temperature: this.getTemperature(),
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
   * Stream LLM response with messages and options
   */
  async streamInvoke(options: InvokeOptions): Promise<{
    textStream: AsyncIterable<string>;
    toolCalls: unknown[];
    toolResults: unknown[];
  }> {
    const messagesWithSystem: ModelMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...options.messages,
    ];

    const result = await streamText({
      model: this.getModel(),
      messages: messagesWithSystem,
      temperature: this.getTemperature(),
      tools: options.useTools ? tools : {},
      stopWhen: stepCountIs(TOOL_CONFIG.MAX_STEPS),
    });

    return {
      textStream: result.textStream,
      toolCalls: (await result.toolCalls) || [],
      toolResults: (await result.toolResults) || [],
    };
  }

  /**
   * Generate text without tools
   */
  async generateText(prompt: string): Promise<string> {
    const messages: ModelMessage[] = [{ role: "user", content: prompt }];

    const result = await generateText({
      model: this.getModel(),
      messages,
      temperature: this.getTemperature(),
    });

    return result.text;
  }
}

export const llmService = new LLMService();
