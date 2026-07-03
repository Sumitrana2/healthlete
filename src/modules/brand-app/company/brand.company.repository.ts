import { db } from "../../../db";
import { companies, industries, companySizes } from "../../../db/schema";
import { ilike, eq } from "drizzle-orm";

export async function searchCompaniesByName(query: string) {
  return await db
    .select({
      id: companies.id,
      name: companies.name,
      website: companies.website,
    //   logoUrl: companies.logoUrl,
    //   country: companies.country,
    //   description: companies.description,
      industry: {
        id: industries.id,
        name: industries.name,
        // slug: industries.slug,
      },
    //   companySize: {
    //     id: companySizes.id,
    //     label: companySizes.label,
    //   },
    })
    .from(companies)
    .leftJoin(industries, eq(companies.industryId, industries.id))
    .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
    .where(ilike(companies.name, `%${query}%`));
}

// export async function getCompanyById(id: string) {
//   const [company] = await db
//     .select({
//       id: companies.id,
//       name: companies.name,
//       website: companies.website,
//       logoUrl: companies.logoUrl,
//       country: companies.country,
//       description: companies.description,
//       industry: {
//         id: industries.id,
//         name: industries.name,
//         slug: industries.slug,
//       },
//       companySize: {
//         id: companySizes.id,
//         label: companySizes.label,
//       },
//     })
//     .from(companies)
//     .leftJoin(industries, eq(companies.industryId, industries.id))
//     .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
//     .where(eq(companies.id, id));

//   return company ?? null;
// }
