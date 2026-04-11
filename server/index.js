require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const interviewRoutes = require("./routes/interviews");
const questionsRoutes = require("./routes/questions");
const InterviewQuestion = require("./models/InterviewQuestion");
const transcribeRoutes = require("./routes/transcribe");
const reviewRoutes = require("./routes/review");
const realTime = require("./routes/real_time");

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed questions if database is empty
    const existingCount = await InterviewQuestion.countDocuments();
    if (existingCount === 0) {
      console.log("\nNo questions found. Auto-seeding from questions.json...");
      try {
        const questionsPath = path.join(__dirname, "data", "questions.json");
        const questionData = JSON.parse(
          fs.readFileSync(questionsPath, "utf-8"),
        );
        const questionsToInsert = Array.isArray(questionData)
          ? questionData
          : [questionData];

        await InterviewQuestion.insertMany(questionsToInsert);
        console.log(
          `Successfully seeded ${questionsToInsert.length} question(s)!\n`,
        );
      } catch (seedError) {
        console.warn("Could not auto-seed questions:", seedError.message);
      }
    }

    // Enable CORS for frontend
    // In production, this allows requests from the deployed Vercel frontend
    const allowedOrigins = [
      process.env.FRONTEND_URL, // Set in Render/production
    ].filter(Boolean); // Remove undefined values

    app.use(
      cors({
        origin: process.env.NODE_ENV === "production" ? allowedOrigins : "*",
        credentials: true,
      }),
    );

    app.use(express.json()); // parses JSON request bodies

    // Health check route
    app.get("/", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });

    app.post("/run", (req, res) => {
      const { code } = req.body;
      const env = {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        NO_COLOR: "1",
        PYTHON_COLORS: "0",
      };
      execFile(
        "python",
        ["-c", code],
        { encoding: "utf8", env, timeout: 5000 },
        (error, stdout, stderr) => {
          res.json({ stdout, stderr, exitCode: error ? error.code : 0 });
        },
      );
    });

    // Auth routes
    app.use("/api/auth", authRoutes);

    // Interview routes
    app.use("/api/interviews", interviewRoutes);

    app.use("/api/realTime", realTime);

    // Questions routes
    app.use("/api/questions", questionsRoutes);

    app.use("/api/review", reviewRoutes);

    // Transcription route
    app.use("/api/transcribe", transcribeRoutes);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
