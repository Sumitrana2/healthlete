import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { BrandRequestUser } from "../../modules/brand/guards/brand-auth.guard";

export const Brand = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BrandRequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.brand;
  }
);
