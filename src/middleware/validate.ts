import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

type ValidateSource = "body" | "query" | "params";

export const validate =
  (schema: ZodTypeAny, source: ValidateSource = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid data",
          details: result.error.flatten().fieldErrors,
        },
      });
    }

    req[source] = result.data;
    next();
  };
