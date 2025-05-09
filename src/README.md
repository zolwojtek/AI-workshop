# Task Categorizer
# Transcription Processor

A TypeScript application that categorizes tasks using OpenAI API.
A TypeScript application that processes and analyzes transcriptions using OpenAI and Groq APIs.

## Running TypeScript Files Locally on Windows

### 1. Prerequisites Installation
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Verify installation by opening Command Prompt and typing:
   ```
   node --version
   npm --version
   ```
3. Install necessary packages:

```
npm install typescript ts-node dotenv openai
npm install -D @types/node
```

4. API keys for OpenAI and Groq services

## 2. Project Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## 3. Project Structure

```
project/
├── .env
├── package.json
├── tsconfig.json
├── transcription/
│   ├── app.ts
│   ├── prompts.ts
│   └── transcriptions/
│       ├── harvard.txt
│       ├── 30 Speaking The Text In Monotone.txt
│       ├── 31 Phrase By Phrase Translation.txt
│       └── 32 Speaking The Text As A Dramatic Reading.txt
└── services/
    ├── openai-service/
    │   └── index.ts
    └── groq-service/
        └── index.ts
```

## 4. Running the Application

To run the transcription processor:

```bash
npm start:completion
npm start:transcription
```

Or using ts-node directly:

```bash
npx ts-node completion/app.ts
npx ts-node transcription/app.ts
```

## 5. Building for Production

Compile TypeScript to JavaScript:

```bash
npm run build
```

Run the compiled JavaScript:

```bash
npm run serve
```

## 6. Security

⚠️ **Important**: 
- Never commit your `.env` file to version control
- Ensure `.env` is listed in your `.gitignore` file
