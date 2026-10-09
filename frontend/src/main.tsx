import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './admin/AdminLayout'
import { AdminLogin } from './admin/AdminLogin'
import { TenantDetailPage } from './admin/TenantDetailPage'
import { TenantsPage } from './admin/TenantsPage'
import { AppLayout } from './app/AppLayout'
import { DashboardPage } from './app/DashboardPage'
import { Login } from './app/Login'
import { ModulePage } from './app/ModulePage'
import { UsersPage } from './app/UsersPage'
import { isSaas } from './config'
import { ApiError } from './lib/api'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry auth/permission/not-found errors; they won't change.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        count < 2,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Super admin panel (SaaS only; on-prem has no /admin API). */}
          {isSaas && (
            <>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<TenantsPage />} />
                <Route path="tenants/:id" element={<TenantDetailPage />} />
              </Route>
            </>
          )}

          {/* Company app */}
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="m/:key" element={<ModulePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
