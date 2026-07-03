import { Router } from "express";
import * as companyService from "./admin.company.service";
import { searchCompanySchema } from "./admin.company.schema";

const router = Router();
router.get(
  "/",
  async (_req, res, next) => {
    try {
      const results = await companyService.searchCompanies();
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