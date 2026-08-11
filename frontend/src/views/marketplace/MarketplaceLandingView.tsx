import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldCheck, Clock, Package, ArrowRight, MapPin, X } from 'lucide-react';
import BuyerBidModal from '../../components/domain/marketplace/BuyerBidModal';

export interface ListingItem {
  _id: string;
  publicTitle: string;
  category: string;
  remainingShelfLife: number; // 0 to 1 decimal representing RSL %
  availableQuantity: number;
  publicPrice: number;
  startingPrice?: number;
  minimumPrice?: number;
  coaVerified?: boolean;
  sanitized?: boolean;
  status: string;
  warehouseRegion?: string;
  discountTier?: string;
  allergens?: string[];
  certifications?: string[];
  imageUrl?: string;
  description?: string;
  expiresAt?: string;
}

interface MarketplaceLandingViewProps {
  onOpenBidModal?: (listing: ListingItem) => void;
  apiBaseUrl?: string;
}

export const MarketplaceLandingView: React.FC<MarketplaceLandingViewProps> = ({
  onOpenBidModal,
  apiBaseUrl = 'http://localhost:5001/api/v1'
}) => {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDiscount, setSelectedDiscount] = useState<string>('All');
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  const [bidModalListing, setBidModalListing] = useState<ListingItem | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState<boolean>(false);

  const handleOpenBid = (listing: ListingItem) => {
    setSelectedListing(listing);
    setBidModalListing(listing);
    setIsBidModalOpen(true);
    if (onOpenBidModal) {
      onOpenBidModal(listing);
    }
  };

  const categories = ['All', 'Dairy', 'Beverages', 'Produce', 'Dry Goods', 'Frozen', 'Bakery'];
  const regions = ['All', 'Midwest', 'East Coast', 'West Coast', 'South', 'Central'];

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedRegion, selectedDiscount]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (selectedRegion !== 'All') queryParams.append('region', selectedRegion);
      if (selectedDiscount !== 'All') queryParams.append('discountTier', selectedDiscount);

      const response = await fetch(`${apiBaseUrl}/marketplace/listings?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.publicTitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const getRSLBadgeColor = (rsl: number) => {
    const percentage = rsl > 1 ? rsl : rsl * 100;
    if (percentage >= 70) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (percentage >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
  };

  const formatRSL = (rsl: number) => {
    const percentage = Math.round(rsl > 1 ? rsl : rsl * 100);
    return `${percentage}% RSL`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* High-Converting Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 border-b border-slate-800/80 px-6 py-12 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Verified COA & Direct Supplier Liquidation
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Direct-from-Supplier <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Surplus Inventory</span> Marketplace
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Source verified CPG food & beverage surplus directly from national brand suppliers. Inspect shelf-life urgency decay curves, lock in floor pricing, and submit instant B2B bids.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Full Pallet & Truckload Batches</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Real-Time RSL % Urgency</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>COA Compliance Gatekeeper</span>
              </div>
            </div>
          </div>

          {/* Quick Search Widget inside Hero */}
          <div className="w-full md:w-96 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" /> Fast Search Catalog
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search catalog by keyword, brand, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {regions.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Dynamic Facet Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Active Surplus Catalog</h2>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-xs text-slate-300 font-semibold">
              {filteredListings.length} Available Listings
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Discount Tier Selector */}
            <select
              value={selectedDiscount}
              onChange={(e) => setSelectedDiscount(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Discounts</option>
              <option value="steep">Steep Discount (50%+ Off)</option>
              <option value="moderate">Moderate Discount (25-50% Off)</option>
              <option value="standard">Standard Discount (&lt;25% Off)</option>
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm">Fetching verified marketplace listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-center px-4">
            <Package className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-200">No Listings Found</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              There are no published listings matching your filter criteria. Try expanding your search or selecting "All" categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing._id}
                onClick={() => setSelectedListing(listing)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between"
              >
                {/* Product Image & Badges */}
                <div className="relative h-48 bg-slate-950 overflow-hidden">
                  <img
                    src={listing.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}
                    alt={listing.publicTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/90 text-slate-200 text-xs font-medium border border-slate-700/80">
                      {listing.category}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRSLBadgeColor(
                        listing.remainingShelfLife
                      )}`}
                    >
                      {formatRSL(listing.remainingShelfLife)}
                    </span>
                  </div>

                  {/* COA Badge */}
                  {listing.coaVerified && (
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" /> COA Verified
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                      {listing.publicTitle}
                    </h3>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>{listing.availableQuantity} cases</span>
                      </div>
                      {listing.warehouseRegion && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{listing.warehouseRegion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & CTA Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-medium">Public Floor Price</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-emerald-400">
                          ${listing.publicPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">/case</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="card-place-bid-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBid(listing);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                    >
                      <span>Place Bid</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Slide-Over Drawer */}
      {selectedListing && (
        <div
          data-testid="listing-detail-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedListing(null)}
        >
          <div
            className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {selectedListing.category}
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">
                    {selectedListing.publicTitle}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Specifications Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Product Specifications
                </h4>

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block">Available Stock</span>
                    <span className="text-sm font-bold text-white">{selectedListing.availableQuantity} cases</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block">Floor Price</span>
                    <span className="text-sm font-bold text-emerald-400">${selectedListing.publicPrice.toFixed(2)} / cs</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block">Shelf Life Decay</span>
                    <span className="text-sm font-bold text-amber-400">{formatRSL(selectedListing.remainingShelfLife)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase block">Warehouse Location</span>
                    <span className="text-sm font-bold text-slate-200">{selectedListing.warehouseRegion || 'Midwest'}</span>
                  </div>
                </div>
              </div>

              {/* Allergen Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Allergen Warnings & Exclusions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.allergens && selectedListing.allergens.length > 0 ? (
                    selectedListing.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold"
                      >
                        {allergen}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No allergen warnings listed</span>
                  )}
                </div>
              </div>

              {/* Certification Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Certifications & Compliance
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.coaVerified && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> COA Verified
                    </span>
                  )}
                  {selectedListing.certifications && selectedListing.certifications.length > 0 ? (
                    selectedListing.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold"
                      >
                        {cert}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold">
                      Standard Quality Audit
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slide-Over Drawer CTA */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                data-testid="drawer-place-bid-btn"
                onClick={() => {
                  if (selectedListing) {
                    handleOpenBid(selectedListing);
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Place Bid</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Unauthenticated buyers can preview catalog. Placing bids triggers verification link.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Buyer Bid Modal */}
      <BuyerBidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        listing={bidModalListing || selectedListing}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
};

export default MarketplaceLandingView;
