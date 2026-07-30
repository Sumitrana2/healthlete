jest.mock("../repositories/languages.repository", () => ({
  LanguagesRepository: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { LanguagesService } from "../services/languages.service";
import { LanguagesRepository } from "../repositories/languages.repository";

describe("LanguagesService", () => {
  let service: LanguagesService;
  const mockRepository = {
    getAllAthleteLanguages: jest.fn().mockResolvedValue([
      { id: "1", name: "English", code: "en" },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesService,
        { provide: LanguagesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(LanguagesService);
  });

  it("delegates to repository", async () => {
    const result = await service.getAthleteLanguages();
    expect(mockRepository.getAllAthleteLanguages).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("English");
  });
});
