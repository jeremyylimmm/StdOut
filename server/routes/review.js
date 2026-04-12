const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { transcript, code, question, testResults, questionType } = req.body;

  let prompt;

  if (questionType === "Theory") {
    // THEORY QUESTION PROMPT
    const hasTranscript = transcript && transcript.trim().length > 30;
    const codeNotes =
      code && code.trim().length > 0
        ? `\n\nNOTES/CODE FROM EDITOR:\n${code}`
        : "";

    prompt = `You are a technical interview evaluator assessing a theory/conceptual question response.

QUESTION: ${question ?? "Unknown"}

TRANSCRIPT (timestamped responses):
${transcript && transcript.trim().length > 0 ? transcript : "(No transcript - candidate did not speak)"}${codeNotes}

Evaluate the candidate on these areas, out of 10 each:
1. **Conceptual Understanding** - Did they demonstrate solid grasp of the concepts? Do they understand the fundamentals?
2. **Clarity of Explanation** - How well did they explain their understanding? Was it clear and organized?
3. **Depth of Knowledge** - Did they go beyond surface level? Did they discuss trade-offs, edge cases, or related concepts?

${!hasTranscript ? "If there is no transcript, all scores should reflect that the candidate did not provide meaningful explanation." : ""}

Address feedback directly to the person (use "you" and "your").

Return JSON:
{
  "conceptualUnderstanding": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "clarityOfExplanation": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "depthOfKnowledge": {
    "score": <number 0-10>,
    "feedback": "<2-3 sentences>"
  },
  "overallScore": <number 0-10>,
  "summary": "<brief overall summary>"
}`;
  } else {
    // CODING QUESTION PROMPT (existing logic)
    let testPerformance = "";
    if (testResults) {
      const { passedCount, totalTests, passPercentage } = testResults;
      testPerformance = `\n\nTEST RESULTS:\nPassed: ${passedCount}/${totalTests} tests (${passPercentage}%)`;
    }

    const hasTranscript = transcript && transcript.trim().length > 30;

    prompt = `You are a technical interview evaluator providing personalized feedback.

CONTEXT:
- The candidate was given starter code with a function definition and docstring
- The function body initially contains only "pass"
- Evaluate ONLY the logic and code they ADDED to the function body
- Do NOT evaluate the function definition or docstring provided

CRITICAL: ${!hasTranscript ? "There is NO meaningful transcript - the candidate did not speak or explain their approach." : "The transcript shows some explanation from the candidate."}

QUESTION: ${question ?? "Unknown"}

TRANSCRIPT (timestamped speech and code changes):
${transcript && transcript.trim().length > 0 ? transcript : "(No transcript - candidate did not speak)"}

FINAL CODE:
${code}${testPerformance}

Evaluate and provide scores out of 10 in these three areas:
1. **Logic** - Did you approach the problem correctly and handle edge cases? ${!hasTranscript ? "(No transcript means no explanation of approach)" : ""}
2. **Code Quality** - Is your implementation clean, efficient, and correct? (Only evaluate code YOU added, ignore starter template)
3. **Reasoning** - Did you clearly explain your thinking throughout? ${!hasTranscript ? "(Score 0 if no transcript)" : ""}

${!hasTranscript ? "If the candidate submitted the code unchanged or added minimal code with NO transcript, all scores should be 0." : ""}

Address feedback directly to the person (use "you" and "your"). Write as personal feedback.

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
  "overallScore": <number 0-10>,
  "summary": "<brief overall summary paragraph directed at you>"
}`;
  }

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
