const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const InterviewQuestion = require("./models/InterviewQuestion");
const connectDB = require("./db");

const seedDatabase = async () => {
  try {
    await connectDB();

    // Read questions from both JSON files
    const questionsPath = path.join(__dirname, "data", "questions.json");
    const technicalQuestionsPath = path.join(
      __dirname,
      "data",
      "technical_questions.json",
    );

    const codingQuestions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
    const theoryQuestions = JSON.parse(
      fs.readFileSync(technicalQuestionsPath, "utf-8"),
    );

    // Handle both single question and array of questions, and set type
    const codingToInsert = Array.isArray(codingQuestions)
      ? codingQuestions.map((q) => ({ ...q, type: "Coding" }))
      : [{ ...codingQuestions, type: "Coding" }];

    const theoryToInsert = Array.isArray(theoryQuestions)
      ? theoryQuestions.map((q) => ({ ...q, type: "Theory" }))
      : [{ ...theoryQuestions, type: "Theory" }];

    const questionsToInsert = [...codingToInsert, ...theoryToInsert];

    console.log(
      `\n📝 Attempting to insert ${questionsToInsert.length} question(s)...`,
    );
    console.log(`   - ${codingToInsert.length} Coding questions`);
    console.log(`   - ${theoryToInsert.length} Theory questions`);

    // Clear all existing questions
    await InterviewQuestion.deleteMany({});
    console.log(`🗑️  Cleared all existing questions`);

    // Insert new questions
    const result = await InterviewQuestion.insertMany(questionsToInsert);

    console.log(`\n✅ Successfully seeded ${result.length} question(s)!`);

    result.forEach((question, index) => {
      console.log(
        `   ${index + 1}. [${question.type}] ${question.company || "N/A"} - "${question.title}" (${question.difficulty})`,
      );
      console.log(`      Test cases: ${question.testCases.length}`);
    });

    console.log(
      "\n💡 Tip: To add more questions, add them to server/data/questions.json or server/data/technical_questions.json",
    );
    console.log("   Format can be a single object or an array of objects.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();
