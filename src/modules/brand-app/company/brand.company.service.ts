import * as companyRepo from "./brand.company.repository";

export async function searchCompanies(query: string) {
  const results = await companyRepo.searchCompaniesByName(query.trim());
  return results;
}

// export async function getCompanyDetail(id: string) {
//   const company = await companyRepo.getCompanyById(id);
//   if (!company) {
//     throw new AppError(404, "Company not found", "COMPANY_NOT_FOUND");
//   }
//   return company;
// }