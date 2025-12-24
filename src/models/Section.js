import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
    title: { type: String, required: true },
    order: { type: Number, required: true }, // section position
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1, order: 1 }, { unique: true }); // ensures order is unique per course

export const Section = mongoose.model("section", sectionSchema);
