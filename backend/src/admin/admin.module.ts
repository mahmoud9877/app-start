import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminTenantsService } from './admin-tenants.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    PassportModule,
    // This JwtService instance is private to AdminModule, so it never signs
    // with the tenant JWT_SECRET.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('ADMIN_JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('ADMIN_JWT_EXPIRES_IN', '1h'),
        } as JwtSignOptions,
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminAuthService, AdminTenantsService, AdminJwtStrategy],
})
export class AdminModule {}
