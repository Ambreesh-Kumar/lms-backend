const errorHandler = (err, req, res, next) => {
  console.error("ERROR ", err)
  // Default error values (used when error is unknown or not explicitly handled)
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose Validation Error
  // Happens when schema validation fails (required fields, enums, etc.)
  // err.name === "ValidationError"
  // err.errors = { fieldName: { message: "validation error message" } }
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Mongoose CastError (Invalid ObjectId)
  // Happens when an invalid MongoDB ObjectId is passed in params
  // err.path = field name (e.g. "_id")
  // err.value = invalid value passed
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB Duplicate Key Error
  // Happens when unique index constraint is violated
  // err.code === 11000
  // err.keyValue = { fieldName: duplicateValue }
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default errorHandler;
