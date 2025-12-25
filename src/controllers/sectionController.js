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

export const updateSection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const { title, order } = req.body;

  if (title === undefined && order === undefined) {
    throw new ApiError(400, "No data provided to update");
  }

  // Validate sectionId
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new ApiError(400, "Invalid section id");
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Fetch course for ownership check
  const course = await Course.findById(section.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this section");
  }

  // Update title
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new ApiError(400, "Section title cannot be empty");
    }
    section.title = title.trim();
  }

  // Update order (NO SHIFTING)
  if (order !== undefined) {
    if (!Number.isInteger(order) || order < 1) {
      throw new ApiError(400, "Order must be a positive integer");
    }

    if (order !== section.order) {
      const orderExists = await Section.findOne({
        course: section.course,
        order,
        _id: { $ne: section._id },
      });

      if (orderExists) {
        throw new ApiError(
          409,
          "Section with this order already exists"
        );
      }

      section.order = order;
    }
  }

  await section.save();

  res.status(200).json({
    success: true,
    message: "Section updated successfully",
    data: section,
  });
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;

  // Validate sectionId
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new ApiError(400, "Invalid section id");
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Fetch course for ownership validation
  const course = await Course.findById(section.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this section");
  }

  // OPTIONAL (Implement later):
  // Prevent deletion if lessons exist under this section
  // const lessonsCount = await Lesson.countDocuments({ section: section._id });
  // if (lessonsCount > 0) {
  //   throw new ApiError(400, "Delete lessons before deleting section");
  // }

  await section.deleteOne();

  res.status(200).json({
    success: true,
    message: "Section deleted successfully",
  });
});


