import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConditionalModule, ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CentralModule } from './central/central.module';
import { CompanyModule } from './company/company.module';
import { isOnPrem } from './config/deployment';
import { validateEnv } from './config/env.validation';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Mounts ClsMiddleware for every route; it runs before TenantMiddleware
    // because imported modules' middleware is registered first.
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    CentralModule,
    TenancyModule,

    // Platform (SaaS only): on-prem installs have no /admin routes at all.
    ConditionalModule.registerWhen(AdminModule, (env) => !isOnPrem(env)),

    // Tenant-scoped modules
    AuthModule,
    UsersModule,
    CompanyModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'admin', method: RequestMethod.ALL },
        { path: 'admin/*path', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
