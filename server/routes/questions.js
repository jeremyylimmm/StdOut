const express = require("express");
const InterviewQuestion = require("../models/InterviewQuestion");
const { execFile } = require("child_process");
const router = express.Router();

// Get random question by company and optionally difficulty
router.get("/random", async (req, res) => {
  try {
    const { company, difficulty } = req.query;

    if (!company) {
      return res.status(400).json({ error: "Company is required" });
    }

    let query = { company: { $in: [company] } };

    // Add difficulty filter if company is LeetCode
    if (company === "LeetCode" && difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await InterviewQuestion.find(query).select("-solution");

    if (questions.length === 0) {
      return res.status(404).json({
        error: `No questions found for company: ${company}${difficulty ? ` and difficulty: ${difficulty}` : ""}`,
      });
    }

    // Get random question
    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];
    res.json(randomQuestion);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch question",
      details: error.message,
    });
  }
});

// Get all questions for a company
router.get("/company/:company", async (req, res) => {
  try {
    const { company } = req.params;
    const questions = await InterviewQuestion.find({
      company: { $in: [company] },
    }).select("-solution");

    if (questions.length === 0) {
      return res.status(404).json({
        error: `No questions found for company: ${company}`,
      });
    }

    res.json(questions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch questions",
      details: error.message,
    });
  }
});

// Get single question
router.get("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;
    const question =
      await InterviewQuestion.findById(questionId).select("-solution");

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch question",
      details: error.message,
    });
  }
});

// Get all companies
router.get("/list/companies", async (req, res) => {
  try {
    const companies = await InterviewQuestion.distinct("company");
    res.json({ companies });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch companies",
      details: error.message,
    });
  }
});

// Submit code and run against test cases
router.post("/:questionId/submit", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const question = await InterviewQuestion.findById(questionId);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const testResults = [];
    let passedCount = 0;

    // Run test cases
    for (const testCase of question.testCases) {
      const testCode = buildTestCode(
        code,
        testCase.input,
        testCase.expectedOutput
      );

      const result = await runPython(testCode);

      const passed = result.exitCode === 0 && result.stdout.trim() === "PASS";
      testResults.push({
        testCaseId: testCase.id,
        passed,
        description: testCase.description,
        isHidden: testCase.isHidden,
        output: passed ? null : result.stdout + result.stderr,
      });

      if (passed) passedCount++;
    }

    const totalTests = question.testCases.length;
    const passPercentage = (passedCount / totalTests) * 100;

    res.json({
      passed: passedCount === totalTests,
      passedCount,
      totalTests,
      passPercentage: Math.round(passPercentage),
      testResults,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit code",
      details: error.message,
    });
  }
});

// Helper function to build test code
function buildTestCode(userCode, input, expectedOutput) {
  // Escape strings properly for Python
  const inputJson = JSON.stringify(input)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
  const expectedJson = JSON.stringify(expectedOutput)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  return `
import json

${userCode}

# Test case execution
try:
    input_data = json.loads("${inputJson}")
    expected = json.loads("${expectedJson}")

    # Call solution function
    # If input is a list, unpack it as arguments; otherwise pass as single arg
    if isinstance(input_data, list):
        result = solution(*input_data)
    else:
        result = solution(input_data)

    if result == expected:
        print("PASS")
    else:
        print("FAIL")
except Exception as e:
    print(f"Error: {str(e)}")
`;
}

// Helper function to run Python code
function runPython(code) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      NO_COLOR: "1",
    };
    execFile(
      "python",
      ["-c", code],
      { encoding: "utf8", env, timeout: 5000 },
      (error, stdout, stderr) => {
        resolve({
          stdout,
          stderr: stderr || "",
          exitCode: error ? error.code : 0,
        });
      },
    );
  });
}

module.exports = router;
