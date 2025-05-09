import "dotenv/config";
import Groq from "groq-sdk";
import { toFile } from "openai";

export class GroqService {
  private groq: Groq;

  constructor(apiKey?: string) {
    this.groq = new Groq({
      apiKey: apiKey || process.env.GROQ_API_KEY
    });
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    const transcription = await this.groq.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'speech.mp3'),
      language: 'pl',
      model: 'whisper-large-v3',
    });
    
    return transcription.text;
  }
}

// Create and export a singleton instance
export const groqService = new GroqService(); 