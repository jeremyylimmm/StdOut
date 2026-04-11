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

Evaluate and score out of 10 in these three areas:
1. **Logic** Did they approach the problem correctly and handle edge cases?
2. **Code Quality** Is the code clean, efficient, and correct?
3. **Reasoning** Did they clearly explain their thinking throughout?

For each area provide a score and 2-3 sentences of feedback. Finish with a brief overall summary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });
    res.json({ review: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "GPT review failed" });
  }
});

module.exports = router;