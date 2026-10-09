// How this installation is deployed (DEPLOYMENT_MODE):
// - saas:   many companies on one install. Each request names its company in
//           x-tenant; the super admin manages companies under /admin.
// - onprem: one company, installed on the customer's own server. No x-tenant
//           header and no /admin routes; the company is created on first boot
//           from ONPREM_* env vars, and its modules come from ONPREM_MODULES.
// Both modes use the same database layout (erp_central + tenant_<slug>), so
// there's a single code path and a single set of migrations.
export const DEPLOYMENT_MODES = ['saas', 'onprem'] as const;
export type DeploymentMode = (typeof DEPLOYMENT_MODES)[number];

export const isOnPrem = (env: { DEPLOYMENT_MODE?: unknown }) =>
  env.DEPLOYMENT_MODE === 'onprem';
