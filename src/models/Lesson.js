import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "section",
      required: true,
    },
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "text"], required: true },
    content: { type: String, required: true }, // video URL or text content
    order: { type: Number, required: true },
    duration: { type: Number }, // in seconds for video lessons
  },
  { timestamps: true }
);

lessonSchema.index({ section: 1, order: 1 }, { unique: true }); // unique order within section

export const Lesson = mongoose.model("lesson", lessonSchema);
