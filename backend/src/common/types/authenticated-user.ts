// request.user for tenant routes, set by JwtStrategy.
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tenant: string;
}

// request.user for /admin routes, set by AdminJwtStrategy.
export interface AuthenticatedAdmin {
  id: string;
  email: string;
}
