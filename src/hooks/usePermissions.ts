import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export type UserRole = 'admin' | 'financial' | 'employee';

export interface Permissions {
  role: UserRole;
  isAdmin: boolean;
  isFinancial: boolean;
  isEmployee: boolean;
  allowedRoutes: string[];
  canAccess: (path: string) => boolean;
}

// Routes accessible by each role
const ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    '/',
    '/clients',
    '/employees',
    '/receivables',
    '/contracts',
    '/emails',
    '/payments',
    '/cashflow',
    '/estimated-expenses',
    '/leads',
    '/users',
    '/projects',
    '/tasks',
    '/meeting-minutes',
    '/dashboard-preview',
  ],
  financial: [
    '/',
    '/clients',
    '/receivables',
    '/contracts',
    '/payments',
    '/cashflow',
    '/estimated-expenses',
    '/leads',
  ],
  employee: [
    '/',
    '/projects',
    '/tasks',
    '/meeting-minutes',
  ],
};

export function usePermissions(): Permissions {
  const { profile } = useAuth();

  return useMemo(() => {
    const role: UserRole = (profile?.role as UserRole) || 'employee';
    const allowedRoutes = ROUTE_PERMISSIONS[role] || ROUTE_PERMISSIONS.employee;

    const canAccess = (path: string): boolean => {
      return allowedRoutes.some(
        (route) => path === route || (route !== '/' && path.startsWith(route + '/'))
      );
    };

    return {
      role,
      isAdmin: role === 'admin',
      isFinancial: role === 'financial',
      isEmployee: role === 'employee',
      allowedRoutes,
      canAccess,
    };
  }, [profile?.role]);
}
