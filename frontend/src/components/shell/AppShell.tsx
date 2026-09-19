import React, { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Header, type HeaderProps } from './Header';
import { ErrorBoundary } from './ErrorBoundary';
import { GlobalModals } from '../modals/GlobalModals';
import type { NavigationTab } from '../../store/slices/coreSlice';
import { GlobalNavigationBar } from '../navigation/GlobalNavigationBar';

export interface AppShellProps {
  children?: React.ReactNode;
  header?: HeaderProps;
  customHeader?: React.ReactNode;
  onTabChange?: (tab: NavigationTab) => void;
  showLegacySidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  customHeader,
  onTabChange,
  showLegacySidebar = false,
}) => {
  return (
    <div className="app-container flex flex-col min-h-screen w-full">
      {showLegacySidebar ? (
        <Sidebar onTabChange={onTabChange} />
      ) : (
        <GlobalNavigationBar onTabChange={onTabChange} />
      )}
      <main className="main-content w-full flex-1">
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
