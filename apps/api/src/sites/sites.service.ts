import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.diveSite.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: {
    name: string;
    description?: string;
    lat: number;
    lng: number;
    difficulty?: string;
  }) {
    return this.prisma.diveSite.create({ data });
  }
}