import { Router } from "express";
import * as taxonomyService from "./taxonomy.service";
import { taxonomyQuerySchema, type TaxonomyQuery } from "./taxonomy.schema";
import { validate } from "../../../middleware/validate";

const router = Router();

router.get("/", validate(taxonomyQuerySchema,"query"), async (req, res, next) => {
  try {
    const query = req.query as unknown as TaxonomyQuery;

    const data = await taxonomyService.getTaxonomy(query);
    res.json({
        success: true,
        message: "Category List",
        data:{list:data},
    });
  } catch (err) {
    next(err);
  }
});

export default router;
