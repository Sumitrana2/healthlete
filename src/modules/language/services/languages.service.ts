import { Injectable } from "@nestjs/common";
import { LanguagesRepository } from "../repositories/languages.repository";

@Injectable()
export class LanguagesService {
  constructor(private readonly repository: LanguagesRepository) {}

  async getAthleteLanguages() {
    return this.repository.getAllAthleteLanguages();
  }
}
