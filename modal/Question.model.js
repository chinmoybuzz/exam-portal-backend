const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-aggregate-paginate-v2");
const { Status } = require("../helper/typeconfig");

const { ObjectId } = mongoose.Types;

// --- Helper Schemas ---

// 1. Schema for an individual option/choice
const ChoiceSchema = new mongoose.Schema(
  {
    // Text of the answer option (e.g., "Hyper Text Markup Language")
    text: {
      type: String,
      required: true,
      trim: true,
    },
    // Used primarily for Multiple Choice (MCQ) or True/False
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// 2. Schema for the question's correct answer (for non-MCQ types)
const AnswerSchema = new mongoose.Schema(
  {
    // For 'ShortAnswer' or 'Numeric' types
    expectedValue: {
      type: String,
      trim: true,
    },
    // For 'Matching' or complex drag-and-drop
    mapping: [
      {
        key: String,
        value: String,
      },
    ],
  },
  { _id: false }
);

// --- Main Question Schema ---
const QuestionSchema = new mongoose.Schema(
  {
    // CORE PROPERTIES
    questionText: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Highly recommended for question text
    },

    // Defines the format of the question and how 'options' or 'answer' is used
    type: {
      type: String,
      enum: ["MCQ_Single", "MCQ_Multiple", "TrueFalse", "ShortAnswer", "Numeric", "Matching"],
      required: true,
      default: "MCQ_Single",
    },

    // OPTIONS (Used by MCQ and True/False types)
    // Store all possible choices here.
    options: {
      type: [ChoiceSchema],
      default: [],
    },

    // AUTHORITATIVE ANSWER (Used by ShortAnswer, Numeric, Matching, and as fallback for MCQ)
    // This is a dedicated field for the solution, especially for non-multiple-choice types.
    correctAnswer: {
      type: AnswerSchema,
      default: {},
    },

    // SUPPLEMENTARY INFORMATION
    explanation: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // METADATA & AUDITING
    category: {
      type: ObjectId,
      ref: "QuizCategories",
      default: null,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    status: { type: Number, enum: Status, default: Status[1] },
    createdBy: {
      type: ObjectId,
      ref: "Users",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    minimize: false, // Ensures empty objects/arrays like 'correctAnswer' are saved
  }
);

// --- Plugins and Indexes ---
QuestionSchema.index({ category: 1 });
QuestionSchema.index({ difficulty: 1 });

QuestionSchema.plugin(mongoosePaginate);

const QuestionModel = mongoose.model("Questions", QuestionSchema);
module.exports = QuestionModel;
