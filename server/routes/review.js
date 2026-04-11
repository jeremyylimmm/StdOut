const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, code, question } = req.body;

  const prompt = `You are a technical interview evaluator. Review the candidate's performance on the following problem.

QUESTION: ${question ?? "Unknown"}

TRANSCRIPT (timestamped speech and code changes):
${transcript}

FINAL CODE:
${code}

Evaluate and provide scores out of 10 in these three areas:
1. **Logic** - Did they approach the problem correctly and handle edge cases?
2. **Code Quality** - Is the code clean, efficient, and correct?
3. **Reasoning** - Did they clearly explain their thinking throughout?

Return your response in the following JSON format:
{
  "logic": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "codeQuality": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "reasoning": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "summary": "<brief overall summary paragraph>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content;

    // Try to parse as JSON
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedReview = JSON.parse(jsonMatch[0]);
        res.json({ review: parsedReview });
      } else {
        // Fallback to plain text if JSON not found
        res.json({ review: { summary: responseText } });
      }
    } catch (parseError) {
      // If JSON parsing fails, return as plain text
      res.json({ review: { summary: responseText } });
    }
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "GPT review failed" });
  }
});

module.exports = router;
