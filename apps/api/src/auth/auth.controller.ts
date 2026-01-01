import { Body, Controller, Headers, Post, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  register(@Body() body: { email: string; password: string; name: string }) {
    return this.auth.register(body);
  }

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }

  @Post("setup-admin")
  setupAdmin(
    @Headers("x-setup-key") setupKey: string,
    @Body() body: { email: string; password: string; name: string },
  ) {
    if (!process.env.SETUP_KEY || setupKey !== process.env.SETUP_KEY) {
      throw new BadRequestException("Setup inválido");
    }
    return this.auth.setupAdmin(body);
  }
}