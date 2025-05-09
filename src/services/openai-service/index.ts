import "dotenv/config";
import OpenAI, { toFile } from "openai";
import type { ChatCompletionMessageParam, ChatCompletion, ChatCompletionChunk } from "openai/resources/chat/completions";
import type { CreateEmbeddingResponse } from 'openai/resources/embeddings';
import { Readable } from "stream";
import { createByModelName } from '@microsoft/tiktokenizer';

// Define a type for OpenAI configuration
export type OpenAIConfig = {
  model: string;
  temperature: number;
  maxTokens: number;
};

export class OpenAIService {
  private openai: OpenAI;
  private tokenizers: Map<string, any> = new Map(); // Changed to any type since we need to handle tiktokenizer separately
  private readonly IM_START = "<|im_start|>";
  private readonly IM_END = "<|im_end|>";
  private readonly IM_SEP = "<|im_sep|>";

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }

  // Method to support token counting if tiktokenizer is available
  async countTokens(messages: ChatCompletionMessageParam[], model: string = 'gpt-4o'): Promise<number> {
    try {    
      if (!this.tokenizers.has(model)) {
        const specialTokens: ReadonlyMap<string, number> = new Map([
          [this.IM_START, 100264],
          [this.IM_END, 100265],
          [this.IM_SEP, 100266],
        ]);
        const tokenizer = await createByModelName(model, specialTokens);
        this.tokenizers.set(model, tokenizer);
      }
      
      const tokenizer = this.tokenizers.get(model)!;
      let formattedContent = '';
      messages.forEach((message) => {
        formattedContent += `${this.IM_START}${message.role}${this.IM_SEP}${message.content || ''}${this.IM_END}`;
      });
      formattedContent += `${this.IM_START}assistant${this.IM_SEP}`;
  
      const tokens = tokenizer.encode(formattedContent, [this.IM_START, this.IM_END, this.IM_SEP]);
      return tokens.length;
    } catch (error) {
      console.warn("Tokenizer not available, returning approximate token count");
      // Fallback to a simple approximation (4 chars ≈ 1 token)
      const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
      return Math.ceil(totalChars / 4);
    }
  }

  async completion(config: {
    messages: ChatCompletionMessageParam[],
    model?: string,
    stream?: boolean,
    temperature?: number,
    jsonMode?: boolean,
    maxTokens?: number
  }): Promise<OpenAI.Chat.Completions.ChatCompletion | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const { 
      messages, 
      model = "gpt-4o", 
      stream = false, 
      jsonMode = false, 
      maxTokens = 4096, 
      temperature = 0 
    } = config;
    
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model,
        stream,
        max_tokens: maxTokens,
        temperature,
        response_format: jsonMode ? { type: "json_object" } : { type: "text" }
      });
      
      return chatCompletion;
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }

  isStreamResponse(response: ChatCompletion | AsyncIterable<ChatCompletionChunk>): response is AsyncIterable<ChatCompletionChunk> {
    return Symbol.asyncIterator in response;
  }

  parseJsonResponse<IResponseFormat>(response: ChatCompletion): IResponseFormat | { error: string, result: boolean } {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid response structure');
      }
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { error: 'Failed to process response', result: false };
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response: CreateEmbeddingResponse = await this.openai.embeddings.create({
        model: "text-embedding-3-large",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  async speak(text: string) {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
  
    const stream = response.body;
    return stream;
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    console.log("Transcribing audio...");
    
    const transcription = await this.openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'speech.mp3'),
      language: 'pl',
      model: 'whisper-1',
    });
    
    return transcription.text;
  }

  /**
   * Classifies a task using the OpenAI API
   * @param task The task to classify
   * @param systemPrompt The system prompt to use
   * @param openaiConfig Optional configuration for the OpenAI request
   * @returns The response content as string
   */
  async classify<T extends string = string>(
    task: string, 
    systemPrompt: string,
    openaiConfig: OpenAIConfig
  ): Promise<T> {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: task }
    ];

    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages,
        model: openaiConfig.model,
        max_tokens: openaiConfig.maxTokens,
        temperature: openaiConfig.temperature,
      });

      if (chatCompletion.choices[0].message?.content) {
        return chatCompletion.choices[0].message.content.trim().toLowerCase() as T;
      } else {
        console.log("Unexpected response format");
        throw new Error("Invalid response format from OpenAI");
      }
    } catch (error) {
      console.error("Error in OpenAI completion:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const openaiService = new OpenAIService(); 