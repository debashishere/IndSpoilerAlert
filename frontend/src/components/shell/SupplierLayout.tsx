import React from 'react';
import { AppShell } from './AppShell';
import type { AppShellProps } from './AppShell';

export const SupplierLayout: React.FC<AppShellProps> = (props) => {
  return <AppShell {...props} />;
};
