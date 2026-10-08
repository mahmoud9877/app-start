// Shape of request.user once authentication is implemented.
export interface AuthenticatedUser {
  id: string;
  email: string;
  permissions: string[];
}
