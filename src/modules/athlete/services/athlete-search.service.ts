import { Injectable } from "@nestjs/common";
import { HypeAuditorService } from "../../../integrations/hypeauditor/hypeauditor.service";

@Injectable()
export class AthleteSearchService {
  constructor(private readonly hypeAuditorService: HypeAuditorService) {}

  search(query: string, st?: string, exclSt?: string) {
    return this.hypeAuditorService.searchAthletes(query, st, exclSt);
  }
}
