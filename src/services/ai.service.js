import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "../utils/ApiError.js";

/**
 * AI Service
 * - Stateless usage
 * - Config-driven
 * - Admin-only consumption
 * - Cost-controlled
 */

const ENABLE_AI = process.env.ENABLE_AI === "true";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

/**
 * Guard: AI enabled & configured
 */
function assertAIEnabled() {
  if (!ENABLE_AI) {
    throw new ApiError(503, "AI features are currently disabled");
  }

  if (!GEMINI_API_KEY) {
    throw new ApiError(500, "AI configuration error");
  }
}

/**
 * Gemini model singleton (lazy init, failure-safe)
 */
let modelInstance = null;

function getGeminiModel() {
  if (modelInstance) return modelInstance;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    modelInstance = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.3,     // deterministic output
        maxOutputTokens: 500, // hard cost limit
      },
    });

    return modelInstance;
  } catch (error) {
    modelInstance = null;
    throw error;
  }
}

/**
 * Execute Gemini prompt safely with timeout
 */
async function runPrompt(prompt) {
  assertAIEnabled();

  try {
    const model = getGeminiModel();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s safety

    const result = await model.generateContent(prompt, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const response = result?.response?.text();
    if (!response) {
      throw new Error("Empty AI response");
    }

    return response.trim();
  } catch (error) {
    console.error("AI Service Error:", error.message);
    throw new ApiError(502, "AI service failed to generate response");
  }
}

/**
 * Safe JSON parser for LLM output
 * (supports object or array responses)
 */
function safeParseJSON(text) {
  try {
    const firstBrace = Math.min(
      ...["{", "["].map(c => text.indexOf(c)).filter(i => i !== -1)
    );
    const lastBrace = Math.max(
      text.lastIndexOf("}"),
      text.lastIndexOf("]")
    );

    if (firstBrace === Infinity || lastBrace === -1) {
      throw new Error("No JSON found");
    }

    const jsonString = text.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonString);
  } catch {
    throw new ApiError(502, "Invalid AI response format");
  }
}

/**
 * Prompt templates
 */
const prompts = {
  lessonSummary({ lessonText }) {
    return `
You are an LMS assistant.

Summarize the following lesson content clearly and concisely.
Use short paragraphs and bullet points where appropriate.

Lesson Content:
${lessonText}

Rules:
- Do NOT invent information
- Do NOT mention that you are an AI
- Keep it concise and structured
`;
  },

  generateMCQs({ lessonText }) {
    return `
You are an LMS assessment generator.

Based ONLY on the lesson content below, generate EXACTLY 5 multiple-choice questions.

Lesson Content:
${lessonText}

Rules:
- Each question must have 4 options
- One correct answer per question
- Do NOT repeat questions
- All questions must be answerable directly from the lesson
- Output MUST be valid JSON ONLY
- No markdown, no explanations

Expected JSON format:
{
  "questions": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": ""
    }
  ]
}
`;
  },

  lessonQnA({ lessonText, question }) {
    return `
You are an LMS assistant.

Answer the question strictly using the lesson content below.

Lesson Content:
${lessonText}

Question:
${question}

Rules:
- Use ONLY the lesson content
- Do NOT use external knowledge
- If answer is not in lesson, reply exactly:
"This information is not available in the lesson."
- Be concise and factual
`;
  },
};

/**
 * Public AI Service API
 */
export const aiService = {
  /**
   * Generate Lesson Summary
   */
  async generateLessonSummary({ lesson }) {
    if (lesson.type === "video") {
      return `Lesson: ${lesson.title}\nVideo URL: ${lesson.content}\nPlease watch this video for the lesson content.`;
    }

    const prompt = prompts.lessonSummary({ lessonText: lesson.content });
    return runPrompt(prompt);
  },

  /**
   * Generate MCQs (text lessons only)
   */
  async generateMCQs({ lesson }) {
    if (lesson.type === "video") {
      throw new ApiError(
        400,
        "Video lessons without transcripts cannot be used for MCQs."
      );
    }

    const prompt = prompts.generateMCQs({ lessonText: lesson.content });
    const rawResponse = await runPrompt(prompt);
    return safeParseJSON(rawResponse);
  },

  /**
   * Lesson-based Q&A (text lessons only)
   */
  async answerLessonQuestion({ lesson, question }) {
    if (lesson.type === "video") {
      throw new ApiError(
        400,
        "Video lessons without transcripts cannot be used for Q&A."
      );
    }

    const prompt = prompts.lessonQnA({ lessonText: lesson.content, question });
    return runPrompt(prompt);
  },
};
