class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Capture stack trace (the call history showing which functions were executed
    // before the error occurred) for this error instance and
    // exclude the ApiError constructor from the trace
    // so the stack points to the actual error source
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
