import { Router } from "express";
import * as companyService from "./brand.company.service";
import { searchCompanySchema } from "./brand.company.schema";
import { validate } from "../../../middleware/validate";

const router = Router();
router.get(
  "/search",
  validate(searchCompanySchema, "query"),
  async (req, res, next) => {
    try {
      const { query } = req.query as { query: string };
      const results = await companyService.searchCompanies(query);
      res.json({
        success: true,
        message: "Companies fetched successfully",
        data: { companies: results },
      });
    } catch (err) {
      next(err);
    }
  }
);

// // GET /brand/company/:id
// router.get(
//   "/:id",
//   validate(getCompanyByIdSchema),
//   async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const company = await companyService.getCompanyDetail(id);
//       res.json({
//         success: true,
//         message: "Company fetched successfully",
//         data: { company },
//       });
//     } catch (err) {
//       next(err);
//     }
//   }
// );

export default router;