import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { Role } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(body: { email: string; password: string; name: string }) {
    const email = body.email?.toLowerCase().trim();
    const name = body.name?.trim();
    const password = body.password;

    if (!email || !name || !password) throw new BadRequestException("Faltan datos");
    if (password.length < 6) throw new BadRequestException("Password mínimo 6 caracteres");

    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException("Email ya registrado");

    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.createUser({ email, name, password: hash, role: Role.USER });

    return this.sign(user.id, user.email, user.role, user.name);
  }

  async login(body: { email: string; password: string }) {
    const email = body.email?.toLowerCase().trim();
    const password = body.password;

    const user = email ? await this.users.findByEmail(email) : null;
    if (!user) throw new UnauthorizedException("Credenciales inválidas");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException("Credenciales inválidas");

    return this.sign(user.id, user.email, user.role, user.name);
  }

  async setupAdmin(body: { email: string; password: string; name: string }) {
    // Solo se permite si NO existe ningún admin todavía
    const admins = await this.users.countAdmins();
    if (admins > 0) throw new BadRequestException("Ya existe un admin");

    const email = body.email?.toLowerCase().trim();
    const name = body.name?.trim();
    const password = body.password;

    if (!email || !name || !password) throw new BadRequestException("Faltan datos");
    if (password.length < 6) throw new BadRequestException("Password mínimo 6 caracteres");

    const exists = await this.users.findByEmail(email);
    if (exists) throw new BadRequestException("Email ya registrado");

    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.createUser({ email, name, password: hash, role: Role.ADMIN });

    return this.sign(user.id, user.email, user.role, user.name);
  }

  private sign(id: string, email: string, role: Role, name: string) {
    const payload = { sub: id, email, role, name };
    const access_token = this.jwt.sign(payload);
    return { access_token, user: { id, email, role, name } };
  }
}
