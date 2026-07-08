import { Request, Response, NextFunction } from "express";
import { deleteUploadedFiles } from "../services/upload/upload.service";

export const requireFile =
(field = "image") =>
async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (req.file) {
        return next();
    }

    await deleteUploadedFiles(req.file);

    return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: `${field}: Required`,
        errors: {
            [field]: ["Required"],
        },
    });
};