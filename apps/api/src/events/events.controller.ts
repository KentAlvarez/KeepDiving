import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // Público: lista por mes
  @Get("events")
  list(@Query("month") month: string) {
    return this.events.listByMonth(month);
  }

  // Público: detalle
  @Get("events/:id")
  get(@Param("id") id: string) {
    return this.events.getById(id);
  }

  // Admin: crear (PROTEGIDO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Post("admin/events")
  create(@Body() body: any) {
    return this.events.createAdmin(body);
  }

  // Público por ahora: reservar (después lo atamos al usuario logueado)
  @Post("events/:id/reserve")
  reserve(
    @Param("id") id: string,
    @Body() body: { userName: string; phone?: string },
  ) {
    return this.events.reserve(id, body);
  }

  // Admin: participantes (PROTEGIDO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @Get("admin/events/:id/participants")
  participants(@Param("id") id: string) {
    return this.events.listParticipants(id);
  }
}
