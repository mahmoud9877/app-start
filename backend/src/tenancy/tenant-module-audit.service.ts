import { Injectable, OnModuleInit, Type } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { IS_ADMIN_ROUTE_KEY } from '../admin/admin-jwt.guard';
import { REQUIRED_MODULE_KEY } from './tenant-modules';

// Fail closed: refuses to boot if any tenant route lacks @RequiresModule() or
// @CoreModule(). Without this, a new controller that forgets the decorator
// would be open to every tenant, paid or not.
@Injectable()
export class TenantModuleAuditService implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const unprotected: string[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const metatype = wrapper.metatype as Type | null;
      const instance = wrapper.instance as object | undefined;
      if (!metatype || !instance) continue;
      if (this.reflector.get<boolean>(IS_ADMIN_ROUTE_KEY, metatype)) continue;
      if (this.reflector.get(REQUIRED_MODULE_KEY, metatype)) continue;

      const prototype = Object.getPrototypeOf(instance) as object;
      for (const method of this.scanner.getAllMethodNames(prototype)) {
        const handler = (prototype as Record<string, unknown>)[method];
        if (typeof handler !== 'function') continue;
        const isRoute =
          this.reflector.get<string>('path', handler) !== undefined;
        if (isRoute && !this.reflector.get(REQUIRED_MODULE_KEY, handler)) {
          unprotected.push(`${metatype.name}.${method}`);
        }
      }
    }

    if (unprotected.length > 0) {
      throw new Error(
        `Tenant routes without @RequiresModule() or @CoreModule(): ${unprotected.join(', ')}`,
      );
    }
  }
}
