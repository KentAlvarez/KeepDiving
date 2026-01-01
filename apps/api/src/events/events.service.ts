import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async listByMonth(month: string) {
    // month: "YYYY-MM"
    const [y, m] = (month ?? "").split("-").map((v) => parseInt(v, 10));
    if (!y || !m || m < 1 || m > 12) {
      throw new BadRequestException("month debe ser YYYY-MM (ej: 2026-01)");
    }

    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

    return this.prisma.event.findMany({
      where: { startAt: { gte: start, lt: end } },
      orderBy: { startAt: "asc" },
      include: { site: true, _count: { select: { reservations: true } } },
    });
  }

  async getById(id: string) {
    const ev = await this.prisma.event.findUnique({
      where: { id },
      include: { site: true, _count: { select: { reservations: true } } },
    });
    if (!ev) throw new NotFoundException("Evento no encontrado");
    return ev;
  }

  async createAdmin(data: {
    type: "LAKE_DIVE" | "TRAVEL";
    status?: "DRAFT" | "PUBLISHED" | "CANCELLED" | "DONE";
    title: string;
    description?: string;
    meetingPoint?: string;
    startAt: string; // ISO
    endAt?: string;  // ISO
    capacity: number;
    priceArs: number;
    minLevel?: string;
    maxDepth?: number;
    siteId?: string;
  }) {
    const start = new Date(data.startAt);
    if (isNaN(start.getTime())) throw new BadRequestException("startAt inválido");

    const end = data.endAt ? new Date(data.endAt) : null;
    if (end && isNaN(end.getTime())) throw new BadRequestException("endAt inválido");

    if (!data.title?.trim()) throw new BadRequestException("title requerido");
    if (!Number.isFinite(data.capacity) || data.capacity <= 0)
      throw new BadRequestException("capacity inválida");
    if (!Number.isFinite(data.priceArs) || data.priceArs < 0)
      throw new BadRequestException("priceArs inválido");

    return this.prisma.event.create({
      data: {
        type: data.type,
        status: data.status ?? "DRAFT",
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        meetingPoint: data.meetingPoint?.trim() || undefined,
        startAt: start,
        endAt: end ?? undefined,
        capacity: Math.floor(data.capacity),
        priceArs: Math.floor(data.priceArs),
        minLevel: data.minLevel?.trim() || undefined,
        maxDepth: data.maxDepth ?? undefined,
        siteId: data.siteId || undefined,
      },
    });
  }

  async reserve(eventId: string, body: { userName: string; phone?: string }) {
    const ev = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundException("Evento no encontrado");
    if (ev.status !== "PUBLISHED") throw new BadRequestException("Evento no disponible");

    const name = body.userName?.trim();
    if (!name) throw new BadRequestException("userName requerido");

    const count = await this.prisma.eventReservation.count({
      where: { eventId, status: "RESERVED" },
    });

    if (count >= ev.capacity) throw new BadRequestException("No hay cupos disponibles");

    return this.prisma.eventReservation.create({
      data: { eventId, userName: name, phone: body.phone?.trim() || undefined },
    });
  }

  async listParticipants(eventId: string) {
    const ev = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundException("Evento no encontrado");

    return this.prisma.eventReservation.findMany({
      where: { eventId, status: "RESERVED" },
      orderBy: { createdAt: "asc" },
    });
  }
}