const axios = require("axios");

exports.parseResume = async (resumeText) => {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const apiBase =
    process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1";
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  const prompt = `
  Extract the following from this resume:
  - Skills
  - Projects
  - Experience
  - Education

  Resume:
  ${resumeText}

  Return JSON format.
  `;

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
};
