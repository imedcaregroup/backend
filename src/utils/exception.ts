export class HttpException extends Error {
  public status: number;
  public message: string;
  public error: string;

  constructor(status: number, message: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.error = message;
  }
}

export class OrderException extends Error {
  public status: number;

  constructor(message: any, status: number = 404) {
    super(message);
    this.status = status;
    this.name = "OrderException";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OrderException);
    }
  }

  static orderNotFound() {
    return new OrderException("Order not found", 404);
  }

  static cannotBeCompleted() {
    return new OrderException(
      "Order can be completed only from status 'accepted'",
      400,
    );
  }

  static couldNotSave() {
    return new OrderException("Failed to update order record", 500);
  }
}
