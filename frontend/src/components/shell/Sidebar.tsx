import React, { useRef, useEffect } from 'react';
import { 
  FileText, 
  List, 
  Cpu, 
  ShoppingBag, 
  BarChart3, 
  Truck,
  Mail,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  setActiveTab, 
  setSidebarExpanded, 
  toggleSidebarExpanded,
  type NavigationTab 
} from '../../store/slices/coreSlice';
import { useAuth } from '../../context/AuthContext';

export interface SidebarProps {
  onTabChange?: (tab: NavigationTab) => void;
}

export const SHOW_DISTRESSED_ANALYTICS = false;
export const SHOW_FREIGHT_LOGISTICS = false;

export const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.core.activeTab);
  const returnTab = useAppSelector((state) => state.core.returnTab);
  const effectiveTab = activeTab === 'lot-hub' ? (returnTab || 'inventory') : activeTab;
  const sidebarExpanded = useAppSelector((state) => state.core.sidebarExpanded);
  const backendHealthy = useAppSelector((state) => state.core.backendHealthy);
  const sidecarHealthy = useAppSelector((state) => state.core.sidecarHealthy);

  let isSupplier = true;
  try {
    const auth = useAuth();
    if (auth?.user) {
      isSupplier = Boolean(auth.user.profiles?.supplier);
    }
  } catch {
    // Optional fallback when mounted outside AuthProvider
    isSupplier = true;
  }

  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (sidebarExpanded && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        dispatch(setSidebarExpanded(false));
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [sidebarExpanded, dispatch]);

  const handleTabClick = (e: React.MouseEvent, tab: NavigationTab) => {
    e.stopPropagation();
    dispatch(setActiveTab(tab));
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${sidebarExpanded ? '' : 'collapsed'}`}
      onClick={!sidebarExpanded ? () => dispatch(setSidebarExpanded(true)) : undefined}
    >
      <div
        className="brand"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(toggleSidebarExpanded());
        }}
      >
        <div className="brand-icon">⚡</div>
        <span className="brand-name">InventoryFlowing</span>
        {sidebarExpanded && (
          <button
            className="sidebar-toggle-btn"
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Collapse Sidebar"
          >
            ◀
          </button>
        )}
      </div>

      <nav>
        <ul className="nav-links">
          {isSupplier && (
            <>
              <li
                className={`nav-link ${effectiveTab === 'ingestion' ? 'active' : ''}`}
                onClick={(e) => handleTabClick(e, 'ingestion')}
              >
                <FileText size={18} />
                <span>Ingestion Engine</span>
              </li>
              <li
                className={`nav-link ${effectiveTab === 'inventory' ? 'active' : ''}`}
                onClick={(e) => handleTabClick(e, 'inventory')}
              >
                <List size={18} />
                <span>Insight</span>
              </li>
              <li
                className={`nav-link ${effectiveTab === 'workflows' ? 'active' : ''}`}
                onClick={(e) => handleTabClick(e, 'workflows')}
              >
                <Cpu size={18} />
                <span>Workflow Setup</span>
              </li>
            </>
          )}

          {/* Common Modules for all authenticated accounts */}
          <li
            className={`nav-link ${effectiveTab === 'marketplace' ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, 'marketplace')}
          >
            <ShoppingBag size={18} />
            <span>Buyer Marketplace</span>
          </li>
          <li
            className={`nav-link ${effectiveTab === 'inbox' ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, 'inbox')}
          >
            <Mail size={18} />
            <span>Inbox</span>
          </li>
          <li
            className={`nav-link ${effectiveTab === 'settings' ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, 'settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </li>

          {SHOW_DISTRESSED_ANALYTICS && isSupplier && (
            <li
              className={`nav-link ${effectiveTab === 'analytics' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'analytics')}
            >
              <BarChart3 size={18} />
              <span>Distressed Analytics</span>
            </li>
          )}
          {SHOW_FREIGHT_LOGISTICS && isSupplier && (
            <li
              className={`nav-link ${effectiveTab === 'logistics' ? 'active' : ''}`}
              onClick={(e) => handleTabClick(e, 'logistics')}
            >
              <Truck size={18} />
              <span>Freight Logistics</span>
            </li>
          )}
        </ul>
      </nav>

      {/* System Health Indicators */}
      <div
        className="sidebar-health-status"
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'hsl(var(--text-muted))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: backendHealthy ? 'hsl(var(--success))' : 'hsl(var(--error))',
            }}
            title={`MongoDB Connection: ${backendHealthy ? 'Connected' : 'Offline'}`}
          />
          <span className="health-text">
            MongoDB: {backendHealthy ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: sidecarHealthy ? 'hsl(var(--success))' : 'hsl(var(--error))',
            }}
            title={`FastAPI Sidecar: ${sidecarHealthy ? 'Online' : 'Offline'}`}
          />
          <span className="health-text">
            FastAPI: {sidecarHealthy ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
};
