import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from './common/guards/permissions.guard';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AccountingModule } from './modules/accounting';
import { AuditLogsModule } from './modules/audit-logs';
import { AuthModule } from './modules/auth';
import { CustomersModule } from './modules/customers';
import { EmployeesModule } from './modules/employees';
import { InventoryModule } from './modules/inventory';
import { NotificationsModule } from './modules/notifications';
import { ProductsModule } from './modules/products';
import { PurchasesModule } from './modules/purchases';
import { ReportsModule } from './modules/reports';
import { RolesPermissionsModule } from './modules/roles-permissions';
import { SalesModule } from './modules/sales';
import { SuppliersModule } from './modules/suppliers';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    DatabaseModule,

    // Foundation
    AuthModule,
    UsersModule,
    RolesPermissionsModule,
    AuditLogsModule,
    NotificationsModule,

    // Master data
    EmployeesModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,

    // Operations
    InventoryModule,
    SalesModule,
    PurchasesModule,
    AccountingModule,

    // Read-only
    ReportsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: PermissionsGuard }],
})
export class AppModule {}
