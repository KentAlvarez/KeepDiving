import { Body, Controller, Get, Post } from "@nestjs/common";
import { SitesService } from "./sites.service";

@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  getAll() {
    return this.sitesService.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      lat: number;
      lng: number;
      difficulty?: string;
    },
  ) {
    return this.sitesService.create(body);
  }
}
