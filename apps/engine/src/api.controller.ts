import { Controller, Get } from "@nestjs/common";

@Controller("api")
export class ApiController {
  @Get("health")
  health() {
    return { status: "ok" };
  }
}
