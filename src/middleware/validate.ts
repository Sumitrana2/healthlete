// import { Request, Response, NextFunction } from "express";
// import { ZodTypeAny } from "zod";

// type ValidateSource = "body" | "query" | "params";

// export const validate =
//   (schema: ZodTypeAny, source: ValidateSource = "body") =>
//   (req: Request, res: Response, next: NextFunction) => {
//     const result = schema.safeParse(req[source]);

//     if (!result.success) {
//       const fieldErrors = result.error.flatten().fieldErrors;
//       const firstField = Object.keys(fieldErrors)[0];
//       const firstMessage = firstField
//         ? `${firstField}: ${
//             fieldErrors[firstField]?.[0] ?? "Validation failed"
//           }`
//         : "Validation failed";

//       return res.status(400).json({
//         success: false,
//         message: firstMessage,
//         code: "VALIDATION_ERROR",
//         errors: fieldErrors,
//       });
//     }

//     req[source] = result.data;
//     next();
//   };
import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { deleteUploadedFiles } from "../services/upload/upload.service";

type ValidateSource = "body" | "query" | "params";

export const validate =
  (
    schema: ZodTypeAny,
    source: ValidateSource = "body",
    wrapped = false
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {

    const data = wrapped
      ? { [source]: req[source] }
      : req[source];

      
    const result = schema.safeParse(data);

    if (!result.success) {

      // rollback uploaded file
      await deleteUploadedFiles(req.file);

      const fieldErrors = result.error.flatten().fieldErrors;

      const firstField = Object.keys(fieldErrors)[0];
      const firstMessage = firstField
        ? `${firstField}: ${
            fieldErrors[firstField]?.[0] ?? "Validation failed"
          }`
        : "Validation failed";

      return res.status(400).json({
        success: false,
        message: firstMessage,
        code: "VALIDATION_ERROR",
        errors: fieldErrors,
      });
    }

    req[source] = wrapped
      ? result.data[source]
      : result.data;

    next();
  };