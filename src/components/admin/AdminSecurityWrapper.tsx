
import React from 'react';
import { useAdminValidation, useSecurityMonitoring } from './EnhancedSecurityHooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AdminSecurityWrapperProps {
  children: React.ReactNode;
  requiredPermission?: string;
  showSecurityBadge?: boolean;
}

export function AdminSecurityWrapper({
  children,
  requiredPermission = 'admin',
  showSecurityBadge = true
}: AdminSecurityWrapperProps) {
  const { validateAdminAccess } = useAdminValidation();
  
  // Initialize security monitoring
  useSecurityMonitoring();

  const { data: hasAccess, isLoading, error } = useQuery({
    queryKey: ['admin-access-validation', requiredPermission],
    queryFn: validateAdminAccess,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Access denied. Administrative privileges required to view this content.
          {error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {error.message}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative">
      {showSecurityBadge && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-bl-md text-xs font-medium flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Secured
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
