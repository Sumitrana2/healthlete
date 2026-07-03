import * as companyRepo from "./admin.company.repository";

export async function searchCompanies() {
  const results = await companyRepo.searchCompaniesByName();
  return results;
}

// export async function getCompanyDetail(id: string) {
//   const company = await companyRepo.getCompanyById(id);
//   if (!company) {
//     throw new AppError(404, "Company not found", "COMPANY_NOT_FOUND");
//   }
//   return company;
// }