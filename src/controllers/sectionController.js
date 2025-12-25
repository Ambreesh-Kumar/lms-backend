import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";

export const createSection = asyncHandler(async (req, res) => {
  const { courseId, title, order } = req.body;

  // Validation
  if (!courseId || !title) {
    throw new ApiError(400, "courseId and title are required");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to add sections to this course");
  }

  // Optional order handling: default to last
  let sectionOrder = order;
  if (sectionOrder === undefined || sectionOrder < 1) {
    const lastSection = await Section.find({ course: courseId })
      .sort({ order: -1 })
      .limit(1)
      .lean();
    sectionOrder = lastSection.length ? lastSection[0].order + 1 : 1;
  }

  const section = await Section.create({
    title: title.trim(),
    course: courseId,
    order: sectionOrder,
  });

  res.status(201).json({
    success: true,
    message: "Section created successfully",
    data: section,
  });
});

export const listSections = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user; // may be undefined if public

  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId).lean();

  if (!course) throw new ApiError(404, "Course not found");

  // Access control
  if (course.status !== "published") {
    if (!user) {
      throw new ApiError(403, "Course is not published");
    }

    if (
      user.role !== "admin" &&
      course.instructor.toString() !== user._id.toString()
    ) {
      throw new ApiError(403, "You are not allowed to access this course sections");
    }
  }

  // Fetch sections ordered by 'order'
  const sections = await Section.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  // Optional: count lessons per section
  const sectionsWithLessonCount = await Promise.all(
    sections.map(async (section) => {
      const lessonCount = await Lesson.countDocuments({ section: section._id });
      return { ...section, lessonCount };
    })
  );

  res.status(200).json({
    success: true,
    data: sectionsWithLessonCount,
  });
});
