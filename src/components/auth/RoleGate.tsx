import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, UserRole } from '@/hooks/usePermissions';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGate({ children, allowedRoles }: RoleGateProps) {
  const { role } = usePermissions();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
