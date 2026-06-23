import type { TaxonomyQuery } from "./taxonomy.schema";

export type TaxonomyInput = TaxonomyQuery;

export interface TaxonomyResult {
  id: number;
  title: string;
}