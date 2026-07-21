// Known order problems carry their existing HTTP status and JSON response.
export class OrderRequestError extends Error {
  constructor(statusCode, responseBody) {
    super(responseBody.message);
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}
