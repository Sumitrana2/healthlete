import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AdminRequestUser } from "../../modules/admin/guards/admin-auth.guard";

export const Admin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminRequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.admin;
  }
);
