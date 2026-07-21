// Keep API parser failures as JSON and hide stack traces and local paths.
export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      message: "Request body must contain valid JSON."
    });
  }

  if (error.type === "entity.too.large") {
    return response.status(413).json({
      message: "Request body is too large."
    });
  }

  console.error("Unhandled request error:", error);

  return response.status(500).json({
    message: "The server could not process this request."
  });
}
