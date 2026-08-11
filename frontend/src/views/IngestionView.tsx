import { Database, DollarSign, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setPipelineTab } from '../store/slices/ingestionSlice';
import { 
  BuyerRegistryPanel,
  SalesRegistryPanel,
  InventoryRegistryPanel 
} from '../components/domain/ingestion';

export const IngestionView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useAppDispatch();
  const pipelineTab = useAppSelector((state) => state.ingestion.pipelineTab);
  const buyers = useAppSelector((state) => state.core.buyers);

  return (
    <div className="ingestion-view-wrapper">
      <header className="header" style={{ marginBottom: '20px' }}>
        <h1 className="header-title">Surplus Ingestion Pipeline</h1>
        <p className="header-subtitle">
          Upload unstructured invoice lists and sales reports for AI-driven parsing and reconciliation.
        </p>
      </header>

      <div className="ingestion-tabs-container">
        <button
          onClick={() => dispatch(setPipelineTab('inventory'))}
          className={`ingestion-tab-btn ${pipelineTab === 'inventory' ? 'active-inventory' : ''}`}
        >
          <Database size={16} />
          <span>📦 Inventory Pipeline</span>
        </button>
        <button
          onClick={() => dispatch(setPipelineTab('sales'))}
          className={`ingestion-tab-btn ${pipelineTab === 'sales' ? 'active-sales' : ''}`}
        >
          <DollarSign size={16} />
          <span>💰 Sales Pipeline</span>
        </button>
        <button
          onClick={() => dispatch(setPipelineTab('buyers'))}
          className={`ingestion-tab-btn ${pipelineTab === 'buyers' ? 'active-buyers' : ''}`}
        >
          <Users size={16} />
          <span>👥 Buyer List</span>
          <span className="buyer-count-badge">
            {buyers.length}
          </span>
        </button>
      </div>

      {pipelineTab === 'inventory' && <InventoryRegistryPanel onOpenLotHub={onOpenLotHub} />}

      {pipelineTab === 'sales' && <SalesRegistryPanel />}

      {pipelineTab === 'buyers' && <BuyerRegistryPanel />}
    </div>
  );
};

export default IngestionView;
