import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../store';
import {
  setFilterSearch,
  setFilterSupplier,
  setFilterDC,
  setFilterCategory,
  setFilterStatus,
} from '../../../store/slices/inventorySlice';
import { fetchInventoryLotsThunk } from '../../../services/inventoryService';

interface InventoryFilterBarProps {
  showListFilters: boolean;
  setShowListFilters: (show: boolean) => void;
  dashboardViewMode: 'table' | 'kanban';
  setDashboardViewMode: (mode: 'table' | 'kanban') => void;
  uniqueSuppliers: string[];
  uniqueDCs: string[];
  uniqueCategories: string[];
}

export const InventoryFilterBar: React.FC<InventoryFilterBarProps> = ({
  showListFilters,
  setShowListFilters,
  dashboardViewMode,
  setDashboardViewMode,
  uniqueSuppliers,
  uniqueDCs,
  uniqueCategories,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    listFilterSearch,
    listFilterSupplier,
    listFilterDC,
    listFilterCategory,
    listFilterStatus,
    loading,
  } = useSelector((state: RootState) => state.inventory);

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'hsl(var(--bg-card-hover) / 30%)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-color))',
          }}
        >
          <button
            onClick={() => setDashboardViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: dashboardViewMode === 'table' ? 'hsl(var(--primary))' : 'transparent',
              color: dashboardViewMode === 'table' ? 'white' : 'hsl(var(--text-secondary))',
              transition: 'all 0.2s',
            }}
          >
            📋 Table View
          </button>
          <button
            onClick={() => setDashboardViewMode('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: dashboardViewMode === 'kanban' ? 'hsl(var(--primary))' : 'transparent',
              color: dashboardViewMode === 'kanban' ? 'white' : 'hsl(var(--text-secondary))',
              transition: 'all 0.2s',
            }}
          >
            🗂️ Kanban Board
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowListFilters(!showListFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <List size={16} />
            {showListFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => dispatch(fetchInventoryLotsThunk())}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem' }}
          >
            {loading ? (
              <div
                className="loader"
                style={{ width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', margin: 0 }}
              />
            ) : (
              <span>🔄</span>
            )}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {showListFilters && (
        <div
          className="collapsible-filters-panel"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}
        >
          <div className="filter-input-group">
            <label>Search Product</label>
            <input
              type="text"
              className="filter-search"
              placeholder="Search SKU, product description..."
              value={listFilterSearch}
              onChange={(e) => dispatch(setFilterSearch(e.target.value))}
            />
          </div>

          <div className="filter-input-group">
            <label>Supplier</label>
            <select
              className="filter-select"
              value={listFilterSupplier}
              onChange={(e) => dispatch(setFilterSupplier(e.target.value))}
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Distribution Center</label>
            <select
              className="filter-select"
              value={listFilterDC}
              onChange={(e) => dispatch(setFilterDC(e.target.value))}
            >
              <option value="">All Warehouses</option>
              {uniqueDCs.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Category</label>
            <select
              className="filter-select"
              value={listFilterCategory}
              onChange={(e) => dispatch(setFilterCategory(e.target.value))}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-input-group">
            <label>Status</label>
            <select
              className="filter-select"
              value={listFilterStatus}
              onChange={(e) => dispatch(setFilterStatus(e.target.value))}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active Listing</option>
              <option value="sold">Sold</option>
              <option value="donated">Donated</option>
              <option value="recycled">Recycled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', justifyContent: 'flex-end' }}>
            {(listFilterSearch || listFilterSupplier || listFilterDC || listFilterCategory || listFilterStatus) && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  dispatch(setFilterSearch(''));
                  dispatch(setFilterSupplier(''));
                  dispatch(setFilterDC(''));
                  dispatch(setFilterCategory(''));
                  dispatch(setFilterStatus(''));
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
