import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X, Play, HelpCircle, RefreshCw } from 'lucide-react';

interface InteractiveTourProps {
  activeTab: 'ingestion' | 'dashboard' | 'analytics' | 'marketplace' | 'inventory' | 'logistics' | 'lot-hub' | 'workflows';
  setActiveTab: (tab: any) => void;
  selectedSupplier: string;
  setSelectedSupplier: (id: string) => void;
  setFile: (file: File | null) => void;
  setParsedResult: (res: any) => void;
  setMappings: (mappings: any) => void;
  setIsImported: (val: boolean) => void;
  setImportCount: (val: number) => void;
  setImportedLotIds: (ids: string[]) => void;
  setSelectedLot: (lot: any) => void;
  setSelectedLotHubId: (id: string | null) => void;
  inventoryList: any[];
  fetchInventory: () => Promise<void>;
  fetchShipments: () => Promise<void>;
  API_BASE_URL: string;
  suppliers: any[];
  openLotOperationsHub: (lot: any, navigate?: boolean, targetSubTab?: any) => Promise<void>;
}

interface TourStep {
  stepNumber: number;
  title: string;
  role: string;
  description: string;
  actionText: string;
  hint: string;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  activeTab,
  setActiveTab,
  selectedSupplier,
  setSelectedSupplier,
  setFile,
  setParsedResult,
  setMappings,
  setIsImported,
  setImportCount,
  setImportedLotIds,
  setSelectedLot,
  setSelectedLotHubId,
  inventoryList,
  fetchInventory,
  fetchShipments,
  API_BASE_URL,
  suppliers,
  openLotOperationsHub,
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem('indSpoilerAlert_tourOpen') !== 'false';
  });
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return parseInt(localStorage.getItem('indSpoilerAlert_tourStep') || '1', 10);
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [targetLotId, setTargetLotId] = useState<string>(() => {
    return localStorage.getItem('indSpoilerAlert_tourLotId') || '';
  });
  const [targetBidId, setTargetBidId] = useState<string>(() => {
    return localStorage.getItem('indSpoilerAlert_tourBidId') || '';
  });
  const [targetShipmentId, setTargetShipmentId] = useState<string>(() => {
    return localStorage.getItem('indSpoilerAlert_tourShipmentId') || '';
  });

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_tourOpen', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_tourStep', String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_tourLotId', targetLotId);
  }, [targetLotId]);

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_tourBidId', targetBidId);
  }, [targetBidId]);

  useEffect(() => {
    localStorage.setItem('indSpoilerAlert_tourShipmentId', targetShipmentId);
  }, [targetShipmentId]);

  const isCorrectTab = () => {
    if (currentStep === 1 && activeTab === 'ingestion') return true;
    if (currentStep === 2 && (activeTab === 'inventory' || activeTab === 'lot-hub')) return true;
    if (currentStep === 3 && (activeTab === 'inventory' || activeTab === 'lot-hub')) return true;
    if (currentStep === 4 && activeTab === 'marketplace') return true;
    if (currentStep === 5 && (activeTab === 'inventory' || activeTab === 'lot-hub')) return true;
    if (currentStep === 6 && activeTab === 'logistics') return true;
    return false;
  };

  const steps: TourStep[] = [
    {
      stepNumber: 1,
      role: '🏢 Supplier (Unilever/Danone)',
      title: 'Messy Data Ingestion',
      description: 'Upload a raw spreadsheet of short-dated products. The AI normalizer will clean abbreviated descriptions, extract package sizes, and suggest mappings.',
      actionText: 'Auto-Ingest Yogurt Lot',
      hint: 'Find test files in your workspace under test_files/danone_messy_invoice.csv'
    },
    {
      stepNumber: 2,
      role: '🏢 Supplier Compliance',
      title: 'FDA Compliance Vault',
      description: 'Before a regulated food lot can be promoted to the buyer marketplace, safety laws require uploading a Certificate of Analysis (COA) and Batch Record.',
      actionText: 'Auto-Upload Compliance Documents',
      hint: 'Goes to Lot Operations Hub -> Compliance and verifies FDA documentation.'
    },
    {
      stepNumber: 3,
      role: '🏢 Supplier Operations',
      title: 'Yield Price Optimization',
      description: 'Calculate the optimal markdown discount using the SciPy solver in the Python sidecar. Once optimized, promote the listing to the Marketplace.',
      actionText: 'Auto-Promote to Marketplace',
      hint: 'Adjust Days-to-Expiration and Volume sliders to optimize COGS recovery.'
    },
    {
      stepNumber: 4,
      role: '🛒 Retail Buyer (Grocery Outlet)',
      title: 'Marketplace Bidding',
      description: 'Browse active deals ranked by semantic embeddings. Place a competitive bid or initiate B2B negotiation counter-offers.',
      actionText: 'Auto-Submit Buyer Bid',
      hint: 'Switch to the Buyer Marketplace tab to browse items and place bids.'
    },
    {
      stepNumber: 5,
      role: '🏢 Supplier Operations',
      title: 'State Negotiation & Awarding',
      description: 'Negotiate bid prices inside the communication stream. Award a portion of the inventory (partial award), auto-generating a PDF Purchase Order (PO).',
      actionText: 'Auto-Award Bid & Generate PO',
      hint: 'Once awarded, a standard PDF PO is uploaded to S3.'
    },
    {
      stepNumber: 6,
      role: '🚚 Logistics & Analytics',
      title: 'Cold-Chain Delivery & ESG Audit',
      description: 'Confirm freight carriers, book dock door pickups, audit temperatures, and view overall recovery rates on the Sustainability Dashboard.',
      actionText: 'Complete Logistics & View ESG Analytics',
      hint: 'Log carrier DOT, temperatures, and verify landfill diversion logs.'
    }
  ];

  const resetTour = () => {
    setCurrentStep(1);
    setTargetLotId('');
    setTargetBidId('');
    setTargetShipmentId('');
    setStatusMessage('');
    setIsProcessing(false);
    setActiveTab('ingestion');
  };

  const handleStepAutoPilot = async () => {
    setIsProcessing(true);
    setStatusMessage('Executing Auto-Pilot actions...');

    try {
      if (currentStep === 1) {
        // --- STEP 1: AUTO INGESTION ---
        setStatusMessage('1/4: Mocking Danone spreadsheet payload...');
        await new Promise(r => setTimeout(r, 600));

        // Let's find Danone supplier
        let supplierId = selectedSupplier;
        if (!supplierId && suppliers.length > 0) {
          const danone = suppliers.find(s => s.name.toLowerCase().includes('danone')) || suppliers[0];
          supplierId = danone._id;
          setSelectedSupplier(supplierId);
        }

        // Generate fake CSV file
        const csvContent = `Product_ID,Item_Name,Stock,Best_Before,Cost,FDA_Regulated
DAN-YG-42,DAN Greek Ygt 4ct,500,${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},3.25,true
ULV-CR-32,ULVR Creamer 32oz,200,${new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},2.50,false`;
        const testFile = new File([csvContent], 'danone_messy_invoice.csv', { type: 'text/csv' });
        setFile(testFile);

        setStatusMessage('2/4: Uploading to ingestion engine...');
        const formData = new FormData();
        formData.append('file', testFile);
        formData.append('supplierId', supplierId);

        const res = await fetch(`${API_BASE_URL}/ingest/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error('Failed to upload file to ingestion API.');
        }

        const uploadResult = await res.json();
        setParsedResult({
          ...uploadResult,
          documentId: uploadResult.documentId || uploadResult._id || uploadResult.ingestionJobId
        });
        setMappings(uploadResult.suggestedMapping || {});

        setStatusMessage('3/4: Cleaning messy SKU names using Gemini AI...');
        await new Promise(r => setTimeout(r, 1200));

        setStatusMessage('4/4: Confirming column mappings & saving Supplier Template...');
        const confirmRes = await fetch(`${API_BASE_URL}/ingest/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: uploadResult.documentId || uploadResult._id || uploadResult.ingestionJobId,
            supplierId: supplierId,
            mappings: uploadResult.suggestedMapping,
            saveTemplate: true,
            templateName: 'Danone Standard Layout'
          })
        });

        if (!confirmRes.ok) {
          throw new Error('Failed to confirm mappings.');
        }

        const confirmData = await confirmRes.json();
        setIsImported(true);
        setImportCount(confirmData.countImported);
        setImportedLotIds(confirmData.lotIds);
        
        await fetchInventory();

        // Save target lot ID (first lot which is yogurt)
        if (confirmData.lotIds && confirmData.lotIds.length > 0) {
          setTargetLotId(confirmData.lotIds[0]);
        }

        setStatusMessage('Yogurt Lot Ingested Successfully! Transitioning to Compliance...');
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(2);

      } else if (currentStep === 2) {
        // --- STEP 2: AUTO COMPLIANCE ---
        let lotId = targetLotId;
        if (!lotId) {
          // Fallback to finding first pending/active lot in list
          const yogurtLot = inventoryList.find(l => l.productId?.description?.toLowerCase().includes('yogurt'));
          if (yogurtLot) lotId = yogurtLot._id;
        }

        if (!lotId) {
          throw new Error('No yogurt lot found to verify. Please complete Step 1 first.');
        }

        // Set fdaRegulated=true
        setStatusMessage('1/3: Flagging lot as FDA-regulated...');
        await fetch(`${API_BASE_URL}/inventory/lot/${lotId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fdaRegulated: true, temperatureMin: 34, temperatureMax: 38 })
        });

        // Fetch fresh list
        await fetchInventory();
        const lotData = inventoryList.find(l => l._id === lotId) || { _id: lotId };
        setSelectedLot(lotData);
        setSelectedLotHubId(lotId);
        setActiveTab('inventory');
        openLotOperationsHub(lotData, true, 'details');

        setStatusMessage('2/3: Uploading FDA Certificate of Analysis (COA)...');
        const coaFile = new File(['coa_pdf_data'], 'coa_report.pdf', { type: 'application/pdf' });
        const coaForm = new FormData();
        coaForm.append('file', coaFile);
        coaForm.append('docType', 'COA');
        
        await fetch(`${API_BASE_URL}/inventory/lot/${lotId}/compliance`, {
          method: 'POST',
          body: coaForm
        });

        await new Promise(r => setTimeout(r, 600));

        setStatusMessage('3/3: Uploading Batch Manufacturing Record...');
        const batchFile = new File(['batch_record_data'], 'batch_record.pdf', { type: 'application/pdf' });
        const batchForm = new FormData();
        batchForm.append('file', batchFile);
        batchForm.append('docType', 'BATCH_RECORD');
        
        const finalDocRes = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}/compliance`, {
          method: 'POST',
          body: batchForm
        });

        if (!finalDocRes.ok) {
          throw new Error('Failed to upload compliance records.');
        }

        await fetchInventory();
        const updatedLot = (await (await fetch(`${API_BASE_URL}/inventory`)).json()).find((l: any) => l._id === lotId);
        if (updatedLot) {
          setSelectedLot(updatedLot);
          openLotOperationsHub(updatedLot, true, 'details');
        }

        setStatusMessage('Lot Verified & Compliant! Transitioning to Pricing...');
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(3);

      } else if (currentStep === 3) {
        // --- STEP 3: AUTO PRICING & PROMOTION ---
        let lotId = targetLotId;
        if (!lotId) {
          const yogurtLot = inventoryList.find(l => l.productId?.description?.toLowerCase().includes('yogurt'));
          if (yogurtLot) lotId = yogurtLot._id;
        }

        if (!lotId) {
          throw new Error('No active lot found. Please run Ingestion first.');
        }

        setStatusMessage('1/3: Loading Opportunity Details...');
        const oppRes = await fetch(`${API_BASE_URL}/inventory/lot/${lotId}/assess-risk`, { method: 'POST' });
        if (!oppRes.ok) {
          throw new Error('Failed to assess risk & create opportunity.');
        }
        const opp = await oppRes.json();

        setStatusMessage('2/3: Calculating L-BFGS-B yield optimization curve...');
        // Request pricing recommend
        const pricingRes = await fetch(`${API_BASE_URL}/inventory/opportunity/${opp._id}/pricing/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ daysRemaining: 15, quantity: 500 })
        });
        if (!pricingRes.ok) {
          throw new Error('Failed to run pricing suggestions.');
        }

        setStatusMessage('3/3: Promoting listing to active marketplace status...');
        const promoteRes = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids/enable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allowBidding: true })
        });

        if (!promoteRes.ok) {
          throw new Error('Failed to activate listing.');
        }

        await fetchInventory();
        const updatedLot = (await (await fetch(`${API_BASE_URL}/inventory`)).json()).find((l: any) => l._id === lotId);
        if (updatedLot) {
          setSelectedLot(updatedLot);
          openLotOperationsHub(updatedLot, true, 'details');
        }

        setStatusMessage('Lot listed on Marketplace! Transitioning to Bidding...');
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(4);

      } else if (currentStep === 4) {
        // --- STEP 4: MOCK BUYER BIDDING ---
        let lotId = targetLotId;
        if (!lotId) {
          const yogurtLot = inventoryList.find(l => l.productId?.description?.toLowerCase().includes('yogurt'));
          if (yogurtLot) lotId = yogurtLot._id;
        }

        if (!lotId) {
          throw new Error('No lot found. Ingest and list a lot first.');
        }

        setStatusMessage('1/2: Finding Marketplace Listing...');
        const lots = await (await fetch(`${API_BASE_URL}/inventory`)).json();
        const targetLot = lots.find((l: any) => l._id === lotId);
        if (!targetLot || !targetLot.listing) {
          throw new Error('Lot does not have an active listing in marketplace.');
        }

        const listingId = targetLot.listing._id;

        // Fetch buyers list to get emails
        const buyersRes = await fetch(`${API_BASE_URL}/buyers`);
        const buyersData = await buyersRes.json();
        const groceryOutlet = buyersData.find((b: any) => b.companyName.toLowerCase().includes('grocery')) || buyersData[0];
        
        setStatusMessage(`2/2: Submitting bid for 300 cases from ${groceryOutlet?.companyName || 'Retail Buyer'}...`);
        const bidRes = await fetch(`${API_BASE_URL}/marketplace/listing/${listingId}/bids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerId: groceryOutlet?._id,
            buyerEmail: groceryOutlet?.email || 'eveline94@ethereal.email',
            quantity: 300,
            price: 2.75
          })
        });

        if (!bidRes.ok) {
          throw new Error('Failed to submit bid.');
        }

        const bidData = await bidRes.json();
        setTargetBidId(bidData._id || bidData.offer?._id);

        await fetchInventory();
        setActiveTab('marketplace');

        setStatusMessage('Bid placed successfully! Switch to Inventory to Negotiate.');
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(5);

      } else if (currentStep === 5) {
        // --- STEP 5: NEGOTIATE & AWARD BID ---
        let lotId = targetLotId;
        let bidId = targetBidId;

        if (!lotId) {
          const yogurtLot = inventoryList.find(l => l.productId?.description?.toLowerCase().includes('yogurt'));
          if (yogurtLot) lotId = yogurtLot._id;
        }

        if (!lotId) {
          throw new Error('No active lot found. Please restart the walkthrough.');
        }

        setStatusMessage('1/2: Fetching active bids...');
        const bidsRes = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids`);
        const bidsData = await bidsRes.json();
        const activeBid = bidsData.find((b: any) => b.status === 'pending') || bidsData[0];
        
        if (!activeBid) {
          throw new Error('No pending bids found. Please submit a bid first.');
        }
        
        bidId = activeBid._id;

        setStatusMessage('2/2: Executing partial award of 300 cases & compiling PDF PO...');
        const awardRes = await fetch(`${API_BASE_URL}/inventory/${lotId}/bids/${bidId}/award`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            awardedQty: 300,
            emailSent: 'Dear Buyer, We have accepted your bid of $2.75/cs for 300 cases of Greek Yogurt. Purchase Order has been generated.',
            emailSubject: 'IndSpoiler Alert Closeout Award: Danone Greek Yogurt 4-Pack'
          })
        });

        if (!awardRes.ok) {
          throw new Error('Failed to award bid.');
        }

        const awardResult = await awardRes.json();
        
        // Find newly generated shipment ID
        const shipmentsRes = await fetch(`${API_BASE_URL}/shipments`);
        const shipmentsData = await shipmentsRes.json();
        const relatedShipment = shipmentsData.find((s: any) => s.awardId?._id === awardResult.award?._id || s.awardId === awardResult.award?._id || s.awardId === awardResult._id);
        if (relatedShipment) {
          setTargetShipmentId(relatedShipment._id);
        }

        await fetchInventory();
        await fetchShipments();

        setStatusMessage('Bid Awarded & PO Uploaded to S3! Transitioning to Logistics...');
        await new Promise(r => setTimeout(r, 1500));
        setCurrentStep(6);

      } else if (currentStep === 6) {
        // --- STEP 6: LOGISTICS & ESG ANALYTICS ---
        let shipmentId = targetShipmentId;

        if (!shipmentId) {
          // Fallback to finding first scheduled shipment
          const shipmentsData = await (await fetch(`${API_BASE_URL}/shipments`)).json();
          if (shipmentsData && shipmentsData.length > 0) {
            shipmentId = shipmentsData[0]._id;
          }
        }

        if (!shipmentId) {
          throw new Error('No shipments found to confirm logistics.');
        }

        setStatusMessage('1/3: Confirming dock door pickup window & carrier...');
        await fetch(`${API_BASE_URL}/shipments/${shipmentId}/confirm-appointment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            pickupWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            carrierName: 'Apex Cold Chain Logistics',
            carrierDotNumber: 'DOT-987654'
          })
        });

        setStatusMessage('2/3: Logging FSMA-compliant transport temperature (36.5°F)...');
        await fetch(`${API_BASE_URL}/shipments/${shipmentId}/temperature`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temperature: 36.5 })
        });

        setStatusMessage('3/3: Dispatching & marking shipment as DELIVERED...');
        await fetch(`${API_BASE_URL}/shipments/${shipmentId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'delivered' })
        });

        await fetchInventory();
        await fetchShipments();

        setActiveTab('analytics');
        setStatusMessage('Walkthrough Completed Successfully! Yield Recovery & ESG charts updated.');
        await new Promise(r => setTimeout(r, 2000));
        setIsOpen(false);
        setCurrentStep(1);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`❌ Error: ${err.message || 'Auto-Pilot execution failed.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (activeTab !== 'ingestion') {
    return null;
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgb(80, 70, 229)',
          color: 'white',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(80, 70, 229, 0.3)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.88rem',
          transition: 'all 0.2s',
        }}
      >
        <Sparkles size={16} />
        <span>Interactive Demo Guide</span>
      </button>
    );
  }

  const activeStepObj = steps[currentStep - 1];

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #18181b 95%, #09090b 98%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(80, 70, 229, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(80, 70, 229, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(80, 70, 229, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            backgroundColor: 'rgb(80, 70, 229)',
            color: 'white',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800
          }}>⚡</div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'white' }}>Surplus Liquidation Loop</h3>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>V1 Walkthrough Assistant</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '3px', width: '100%', backgroundColor: '#27272a' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${(currentStep / steps.length) * 100}%`, 
            backgroundColor: 'rgb(80, 70, 229)',
            transition: 'width 0.3s ease-in-out'
          }} 
        />
      </div>

      {/* Content */}
      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            color: 'rgb(80, 70, 229)',
            backgroundColor: 'rgba(80, 70, 229, 0.1)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            Step {currentStep} of {steps.length}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
            {activeStepObj.role}
          </span>
        </div>

        {/* Step Title & Desc */}
        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeStepObj.title}
          </h4>
          <p style={{ fontSize: '0.85rem', color: '#e4e4e7', lineHeight: '1.45', margin: 0 }}>
            {activeStepObj.description}
          </p>
        </div>

        {/* Tab check warning */}
        {!isCorrectTab() && (
          <div style={{
            fontSize: '0.75rem',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <span>⚠️ Click 'Auto-Pilot' to auto-switch tabs & perform actions</span>
          </div>
        )}

        {/* Status Area */}
        {statusMessage && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#09090b',
              borderLeft: '3px solid rgb(80, 70, 229)',
              fontSize: '0.78rem',
              color: '#d4d4d8',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} style={{ color: '#10b981' }} />}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <button
            onClick={handleStepAutoPilot}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgb(80, 70, 229)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(80, 70, 229, 0.25)'
            }}
          >
            <Play size={14} />
            <span>{activeStepObj.actionText}</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isProcessing}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#71717a',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: (currentStep === 1 || isProcessing) ? 'not-allowed' : 'pointer'
              }}
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
              disabled={currentStep === steps.length || isProcessing}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#d4d4d8',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: (currentStep === steps.length || isProcessing) ? 'not-allowed' : 'pointer'
              }}
            >
              Skip Step
            </button>
          </div>
        </div>

        {/* Tip / Hint */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px' }}>
          <HelpCircle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '0.75rem', color: '#71717a', fontStyle: 'italic' }}>
            {activeStepObj.hint}
          </span>
        </div>

      </div>

      {/* Footer Info */}
      <div 
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#09090b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button 
          onClick={resetTour}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          Reset Walkthrough
        </button>
        <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
          v1.0.0 Stable
        </span>
      </div>
    </div>
  );
};
