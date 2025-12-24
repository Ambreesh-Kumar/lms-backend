export const requireInstructor = (req, res, next) => {
  if (req.user.role !== "instructor") {
    return res.status(403).json({
      success: false,
      message: "Instructor access required",
    });
  }
  next();
};
