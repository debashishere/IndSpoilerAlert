import React, { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Header, type HeaderProps } from './Header';
import { ErrorBoundary } from './ErrorBoundary';
import { GlobalModals } from '../modals/GlobalModals';
import type { NavigationTab } from '../../store/slices/coreSlice';

export interface AppShellProps {
  children?: React.ReactNode;
  header?: HeaderProps;
  customHeader?: React.ReactNode;
  onTabChange?: (tab: NavigationTab) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  customHeader,
  onTabChange,
}) => {
  return (
    <div className="app-container">
      <Sidebar onTabChange={onTabChange} />
      <main className="main-content">
        {customHeader || (header ? <Header {...header} /> : null)}
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                className="loading-fallback"
                style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}
              >
                Loading view...
              </div>
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <GlobalModals />
    </div>
  );
};
