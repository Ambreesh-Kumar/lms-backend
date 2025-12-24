import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: { type: Number, required: true, min: 0 },
    thumbnail: { type: String }, // image URL
    status: {
      type: String,
      enum: ["draft", "published", "unpublished"],
      default: "draft",
    },
    totalSections: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    totalEnrollments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for searching/filtering courses
courseSchema.index({ title: "text", category: 1, price: 1, level: 1 });

export const Course = mongoose.model("course", courseSchema);
