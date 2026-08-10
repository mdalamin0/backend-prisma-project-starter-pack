import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;
