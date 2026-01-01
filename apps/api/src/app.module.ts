import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { SitesModule } from "./sites/sites.module";
import { EventsModule } from "./events/events.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // <-- lee .env automáticamente
    PrismaModule,
    SitesModule,
    EventsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
