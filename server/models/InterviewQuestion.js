const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expectedOutput: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const solutionSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      default: "python",
    },
    code: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
    },
    timeComplexity: {
      type: String,
      default: "",
    },
    spaceComplexity: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const interviewQuestionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["Coding", "Theory"],
      required: true,
      index: true,
    },
    company: {
      type: [String],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    patterns: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    constraints: {
      type: Map,
      of: String,
      default: new Map(),
    },
    followUps: {
      type: [String],
      default: [],
    },
    solution: {
      type: solutionSchema,
      required: true,
    },
    testCases: {
      type: [testCaseSchema],
      required: true,
    },
    initialCode: {
      type: String,
      required: true,
    },
    timeLimit: {
      type: Number,
      default: 900,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InterviewQuestion", interviewQuestionSchema);
