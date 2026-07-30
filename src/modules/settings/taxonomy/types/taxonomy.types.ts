import type { TaxonomyQuery } from "../dto/taxonomy.dto";

export type TaxonomyInput = TaxonomyQuery;

export interface TaxonomyResult {
  id: number;
  title: string;
}