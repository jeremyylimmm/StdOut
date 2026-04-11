// routes/review.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, code } = req.body;

  const prompt = `You are a technical interview evaluator. Review the candidate's performance based on their spoken reasoning and code.

TRANSCRIPT (timestamped speech + code changes):
${transcript}

FINAL CODE:
${code}

Score and give feedback on three areas:
1. **Logic** Did they approach the problem correctly? Did they identify edge cases?
2. **Code Quality** Is the code clean, efficient, and correct?
3. **Reasoning** Did they clearly explain their thinking as they worked?

For each area give a score out of 10 and 2-3 sentences of feedback. End with an overall summary.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    res.json({ review: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GPT review failed" });
  }
});

module.exports = router;