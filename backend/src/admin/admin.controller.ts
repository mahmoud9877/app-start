import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AdminRoute } from './admin-jwt.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminTenantsService } from './admin-tenants.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { EnableModuleDto } from './dto/enable-module.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

// Platform routes. No x-tenant header: TenantMiddleware skips /admin/*.
@AdminRoute()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly auth: AdminAuthService,
    private readonly tenants: AdminTenantsService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto);
  }

  @Get('tenants')
  findTenants() {
    return this.tenants.findAll();
  }

  @Get('tenants/:id')
  findTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.findOne(id);
  }

  @Post('tenants')
  createTenant(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Patch('tenants/:id')
  updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenants.update(id, dto);
  }

  // The company must be suspended first (409 otherwise).
  @Delete('tenants/:id')
  @HttpCode(204)
  deleteTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.remove(id);
  }

  @Get('modules')
  listModules() {
    return this.tenants.listAvailableModules();
  }

  @Post('tenants/:id/modules')
  @HttpCode(200)
  enableModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnableModuleDto,
  ) {
    return this.tenants.enableModule(id, dto);
  }

  @Delete('tenants/:id/modules/:module')
  disableModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('module') module: string,
  ) {
    return this.tenants.disableModule(id, module);
  }

  @Patch('tenants/:id/suspend')
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.suspend(id);
  }

  @Patch('tenants/:id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenants.activate(id);
  }
}
