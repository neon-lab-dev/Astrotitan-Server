/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { TErrorSourse } from "../interface/error";
import config from "../config";
import handleZodError from "../errors/ZodError";
import handleValidationError from "../errors/ValidationError";
import handleCastError from "../errors/CastError";
import AppError from "../errors/AppError";

const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction // add next
) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorSourse: TErrorSourse = [
    {
      path: "",
      message: "Something went wrong!",
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode || 400;
    message = simplifiedError?.message;
    errorSourse = simplifiedError?.errorSources;
  } else if (err?.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode || 400;
    message = simplifiedError?.message;
    errorSourse = simplifiedError?.errorSources;
  } else if (err?.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode || 400;
    message = simplifiedError?.message;
    errorSourse = simplifiedError?.errorSources;
  }else if(err instanceof AppError){
    statusCode = err?.statusCode;
    message = err?.message;
    errorSourse = [{
        path: "",
        message : err?.message
    }]
}
 else if (err instanceof Error) {
    message = err.message;
    errorSourse = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errorSourse,
    stack: config.node_env === "development" ? err.stack : null,
  });
};

export default globalErrorHandler;
