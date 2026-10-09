// Must match the backend's DEPLOYMENT_MODE.
// saas:   users type their company code on login; /admin is available.
// onprem: one company, no company code, no /admin.
export const DEPLOYMENT_MODE: 'saas' | 'onprem' =
  import.meta.env.VITE_DEPLOYMENT_MODE === 'onprem' ? 'onprem' : 'saas'

export const isSaas = DEPLOYMENT_MODE === 'saas'
