const axios = require("axios");

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const apiBase =
  process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1";
const apiKey = process.env.GOOGLE_AI_API_KEY;

async function callGemini(prompt) {
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  try {
    const response = await axios.post(
      `${apiBase}/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        timeout: 30000,
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Gemini response did not contain text output");
    }

    return text;
  } catch (error) {
    const status = error.response?.status;
    const apiMessage = error.response?.data?.error?.message;
    throw new Error(
      status
        ? `Gemini API ${status}: ${apiMessage || error.message}`
        : `Gemini API error: ${error.message}`
    );
  }
}

function resumeToPromptText(parsedResume) {
  if (typeof parsedResume === "string") {
    return parsedResume;
  }

  return JSON.stringify(parsedResume, null, 2);
}

exports.generateQuestions = async (parsedResume) => {
  const prompt = `
  You are an interview coach.

  Based on the candidate resume below, create exactly 5 technical interview questions.
  Focus on skills, projects, and experience mentioned in the resume.
  Return only questions, one per line, without extra explanation.

  Resume:
  ${resumeToPromptText(parsedResume)}
  `;

  return callGemini(prompt);
};

exports.evaluateAnswer = async (question, answer) => {
  const prompt = `
  Question: ${question}
  Candidate Answer: ${answer}

  Evaluate:
  - Technical correctness
  - Communication clarity
  - Confidence level
  - Give score out of 10
  - Suggest improvements
  `;

  return callGemini(prompt);
};
