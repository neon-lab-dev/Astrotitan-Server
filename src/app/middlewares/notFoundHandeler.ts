import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(httpStatus.NOT_FOUND, 'Route Not Found');
  next(err);
};

export default notFoundHandler;
