import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUser(data: { email: string; password: string; name: string; role?: Role }) {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name.trim(),
        role: data.role ?? Role.USER,
      },
    });
  }

  countAdmins() {
    return this.prisma.user.count({ where: { role: Role.ADMIN } });
  }
}