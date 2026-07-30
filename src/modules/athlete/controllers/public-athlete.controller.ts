import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

/** Public athlete surface (future unauthenticated endpoints). */
@ApiTags("Public Athletes")
@Controller("public/athletes")
export class PublicAthleteController {}
