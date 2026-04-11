const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, code, question, testResults } = req.body;

  // Calculate test performance summary
  let testPerformance = "";
  if (testResults) {
    const { passedCount, totalTests, passPercentage } = testResults;
    testPerformance = `\n\nTEST RESULTS:\nPassed: ${passedCount}/${totalTests} tests (${passPercentage}%)`;
  }

  const prompt = `You are a technical interview evaluator providing personalized feedback.

IMPORTANT: The code always includes a starter function definition with a docstring at the top. Evaluate ONLY the logic and implementation the candidate added inside the function body, NOT the function definition itself.

If the candidate has NOT added any real logic (i.e., the function body is empty or contains only placeholder/pass statements), give a score of 0 with appropriate feedback about not attempting the problem.

QUESTION: ${question ?? "Unknown"}

TRANSCRIPT (timestamped speech and code changes):
${transcript}

FINAL CODE:
${code}${testPerformance}

Evaluate and provide scores out of 10 in these three areas:
1. **Logic** - Did you approach the problem correctly and handle edge cases?
2. **Code Quality** - Is your implementation clean, efficient, and correct? (Ignore the starter function definition and docstring)
3. **Reasoning** - Did you clearly explain your thinking throughout?

Address feedback directly to the person (use "you" and "your" instead of "the candidate"). Write the summary as personal feedback, not as an evaluation of someone else.

Return your response in the following JSON format:
{
  "logic": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences directed at you>"
  },
  "codeQuality": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences directed at you>"
  },
  "reasoning": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences directed at you>"
  },
  "overallScore": <number 0-10 (average of the three scores)>,
  "summary": "<brief overall summary paragraph directed at you>"
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
