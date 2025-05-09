import * as fs from 'fs/promises';
import filesys from 'fs';
import path from 'path';
import type OpenAI from 'openai';
import { OpenAIService } from '../services/openai-service';
import { GroqService } from '../services/groq-service';
import { sherlockPrompt } from './prompts';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

async function processAudioFiles() {
  const audioDir = path.join(__dirname, './audio');
  const transcriptionDir = path.join(__dirname, './transcriptions');
  const groqService = new GroqService();

  try {
    // Create transcription directory if it doesn't exist
    await fs.mkdir(transcriptionDir, { recursive: true });

    // Read all files from audio directory
    const files = await fs.readdir(audioDir);
    
    // Filter for audio files
    const audioFiles = files.filter(file => 
      file.toLowerCase().endsWith('.mp3') || 
      file.toLowerCase().endsWith('.wav')
    );

    console.log(`Found ${audioFiles.length} audio files to process`);

    // Process each audio file
    for (const audioFile of audioFiles) {
      const audioPath = path.join(audioDir, audioFile);
      const outputFileName = `${path.parse(audioFile).name}.txt`;
      const outputPath = path.join(transcriptionDir, outputFileName);

      console.log(`Processing ${audioFile}...`);

      try {
        const fullPath = path.resolve(audioPath);
        const audioBuffer = filesys.readFileSync(fullPath);
        // Get transcription from Groq service
        const transcription = await groqService.transcribe(audioBuffer);
        
        // Save transcription to file
        await fs.writeFile(outputPath, transcription, 'utf-8');
        
        console.log(`Successfully transcribed ${audioFile} to ${outputFileName}`);
      } catch (error) {
        console.error(`Error processing ${audioFile}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing audio files:', error);
    throw error;
  }
}

// Example usage
async function main() {
  await processAudioFiles();
}

// Run the application if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error("Application error:", error);
    process.exit(1);
  });
}