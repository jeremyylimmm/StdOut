const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interview: {
      title: {
        type: String,
        required: true,
      },
      questionTitle: {
        type: String,
      },
      questionType: {
        type: String,
        enum: ["Coding", "Theory"],
        default: "Coding",
      },
      company: {
        type: String,
      },
      difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true,
      },
      durationMinutes: {
        type: Number,
        required: true,
      },
      questionId: {
        type: String,
        default: null,
      },
    },
    transcript: {
      type: String,
      default: "",
    },
    review: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    code: {
      type: String,
      default: "",
    },
    timeLeftSeconds: {
      type: Number,
      default: 0,
    },
    testResults: {
      passed: {
        type: Boolean,
        default: false,
      },
      passedCount: {
        type: Number,
        default: 0,
      },
      totalTests: {
        type: Number,
        default: 0,
      },
      passPercentage: {
        type: Number,
        default: 0,
      },
      testCases: [
        {
          testCaseId: Number,
          passed: Boolean,
          description: String,
          isHidden: Boolean,
          input: mongoose.Schema.Types.Mixed,
          expectedOutput: mongoose.Schema.Types.Mixed,
          actualOutput: String,
        },
      ],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
