import React, { useState, useEffect } from 'react';
import { X, Lock, Pencil, Trash2, Plus, Minus, Search, Check, AlertTriangle, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
  selectBuyerLists, 
  selectBuyers, 
  createBuyerListThunk, 
  updateBuyerListThunk, 
  deleteBuyerListThunk, 
  updateBuyerListMembersThunk
} from '../../../store/slices/coreSlice';

interface BuyerListManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedListId?: string;
}

export const BuyerListManagerModal: React.FC<BuyerListManagerModalProps> = ({ 
  isOpen, 
  onClose,
  initialSelectedListId 
}) => {
  const dispatch = useAppDispatch();
  const buyerLists = useAppSelector(selectBuyerLists);
  const allBuyers = useAppSelector(selectBuyers);

  const [selectedListId, setSelectedListId] = useState<string | null>(initialSelectedListId || null);

  useEffect(() => {
    if (isOpen && initialSelectedListId) {
      setSelectedListId(initialSelectedListId);
    }
  }, [isOpen, initialSelectedListId]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

  // Draft member state & search queries
  const [draftMemberIds, setDraftMemberIds] = useState<string[]>([]);
  const [currentMemberSearch, setCurrentMemberSearch] = useState('');
  const [availableBuyerSearch, setAvailableBuyerSearch] = useState('');

  // Switch list confirmation state
  const [pendingSwitchListId, setPendingSwitchListId] = useState<string | null>(null);

  const activeListId = selectedListId || buyerLists[0]?._id || null;
  const currentList = buyerLists.find((l) => l._id === activeListId) || null;
  const listToDelete = buyerLists.find((l) => l._id === deletingListId);

  // Sync draftMemberIds when current list changes or updates
  useEffect(() => {
    if (currentList) {
      const initialIds = (currentList.buyerIds || []).map((b: any) => (typeof b === 'object' ? b._id : b));
      setDraftMemberIds(initialIds);
    } else {
      setDraftMemberIds([]);
    }
  }, [currentList?._id, currentList?.updatedAt, currentList?.buyerIds]);

  // Compute dirty state
  const originalIds = (currentList?.buyerIds || []).map((b: any) => (typeof b === 'object' ? b._id : b)).sort();
  const currentDraftSorted = [...draftMemberIds].sort();
  const isDirty = currentList ? JSON.stringify(originalIds) !== JSON.stringify(currentDraftSorted) : false;

  const handleSelectList = (targetId: string) => {
    if (targetId === currentList?._id) return;
    if (isDirty) {
      setPendingSwitchListId(targetId);
    } else {
      setSelectedListId(targetId);
    }
  };

  const handleConfirmSwitchList = () => {
    if (pendingSwitchListId) {
      setSelectedListId(pendingSwitchListId);
      const targetList = buyerLists.find((l) => l._id === pendingSwitchListId);
      if (targetList) {
        const initialIds = (targetList.buyerIds || []).map((b: any) => (typeof b === 'object' ? b._id : b));
        setDraftMemberIds(initialIds);
      }
      setPendingSwitchListId(null);
    }
  };

  const handleCreateList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newListName.trim()) return;
    const res = await dispatch(createBuyerListThunk({ name: newListName.trim() }));
    if (createBuyerListThunk.fulfilled.match(res)) {
      if (res.payload && res.payload._id) {
        setSelectedListId(res.payload._id);
      }
      setNewListName('');
      setIsCreatingNew(false);
    }
  };

  const handleSaveRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingName.trim()) return;
    await dispatch(updateBuyerListThunk({ id, name: editingName.trim() }));
    setEditingListId(null);
    setEditingName('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingListId) return;
    await dispatch(deleteBuyerListThunk(deletingListId));
    if (selectedListId === deletingListId) {
      setSelectedListId(null);
    }
    setDeletingListId(null);
  };

  const handleAddMember = (buyerId: string) => {
    if (!draftMemberIds.includes(buyerId)) {
      setDraftMemberIds([...draftMemberIds, buyerId]);
    }
  };

  const handleRemoveMember = (buyerId: string) => {
    setDraftMemberIds(draftMemberIds.filter((id) => id !== buyerId));
  };

  const handleSaveChanges = async () => {
    if (!currentList) return;
    await dispatch(updateBuyerListMembersThunk({ id: currentList._id, buyerIds: draftMemberIds }));
  };

  // Helper arrays for two-column rendering
  const currentMembersList = allBuyers.filter((b) => b._id && draftMemberIds.includes(b._id));
  const availableBuyersList = allBuyers.filter((b) => b._id && !draftMemberIds.includes(b._id));

  const filteredCurrentMembers = currentMembersList.filter((b) => {
    const q = currentMemberSearch.toLowerCase();
    return !q || (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q);
  });

  const filteredAvailableBuyers = availableBuyersList.filter((b) => {
    const q = availableBuyerSearch.toLowerCase();
    return !q || (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q);
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isDirty) {
            if (window.confirm('You have unsaved changes. Close anyway?')) onClose();
          } else {
            onClose();
          }
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Buyer List Manager
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Manage custom buyer lists and assign member rosters
            </p>
          </div>
          <button
            onClick={() => {
              if (isDirty) {
                if (window.confirm('You have unsaved changes. Close anyway?')) onClose();
              } else {
                onClose();
              }
            }}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {deletingListId && listToDelete && (
          <div className="bg-rose-950/80 border-b border-rose-800/60 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-rose-200 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Are you sure you want to delete &quot;{listToDelete.name}&quot;?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                data-testid="confirm-delete-btn"
                onClick={handleConfirmDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Delete List
              </button>
              <button
                onClick={() => setDeletingListId(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Switch List Confirmation Overlay */}
        {pendingSwitchListId && (
          <div className="bg-amber-950/90 border-b border-amber-800/60 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-200 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You have unsaved changes. Switch list anyway?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                data-testid="confirm-switch-btn"
                onClick={handleConfirmSwitchList}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Switch List
              </button>
              <button
                onClick={() => setPendingSwitchListId(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
              >
                Stay
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: Two Panel Layout */}
        <div className="flex-1 flex min-h-[500px] overflow-hidden">
          {/* Left Panel: Directory */}
          <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-900/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Buyer Lists ({buyerLists.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {buyerLists.map((list) => {
                const isSelected = currentList?._id === list._id;
                const isSystem = list.type === 'primary' || list.type === 'secondary';
                const memberCount = Array.isArray(list.buyerIds) ? list.buyerIds.length : 0;
                const isEditingThis = editingListId === list._id;

                return (
                  <div
                    key={list._id}
                    onClick={() => {
                      if (!isEditingThis) handleSelectList(list._id);
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEditingThis ? (
                      <form 
                        onSubmit={(e) => handleSaveRename(list._id, e)} 
                        className="flex items-center gap-1.5 w-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          data-testid={`save-edit-list-${list._id}`}
                          className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingListId(null)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{list.name}</span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                isSystem
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                              }`}
                            >
                              {isSystem ? 'System' : 'Custom'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {memberCount} member{memberCount === 1 ? '' : 's'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isSystem ? (
                            <div
                              data-testid={`lock-icon-${list._id}`}
                              className="p-1 text-slate-400 dark:text-slate-500"
                              title="System list (protected)"
                            >
                              <Lock className="w-4 h-4" />
                            </div>
                          ) : (
                            <>
                              <button
                                data-testid={`edit-list-${list._id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingListId(list._id);
                                  setEditingName(list.name);
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-500 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                title="Rename List"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                data-testid={`delete-list-${list._id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingListId(list._id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                                title="Delete List"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom New List button or inline form */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60">
              {isCreatingNew ? (
                <form onSubmit={handleCreateList} className="space-y-2">
                  <input
                    type="text"
                    placeholder="List name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      data-testid="save-new-list-btn"
                      className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewListName('');
                      }}
                      className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>New List</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Bulk Member Assignment */}
          <div className="flex-1 p-5 bg-slate-50/30 dark:bg-slate-950/30 flex flex-col min-w-0">
            {currentList ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header for Right Panel */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                        {currentList.name} — Members
                      </h3>
                      {isDirty && (
                        <span
                          data-testid="dirty-indicator"
                          className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 rounded-full flex items-center gap-1 shrink-0"
                        >
                          <AlertTriangle className="w-3 h-3" /> Unsaved changes
                        </span>
                      )}
                    </div>
                    {currentList.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {currentList.description}
                      </p>
                    )}
                  </div>

                  <button
                    data-testid="save-members-btn"
                    onClick={handleSaveChanges}
                    disabled={!isDirty}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                      isDirty
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700/50'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>

                {/* Two Columns Container */}
                <div className="flex-1 grid grid-cols-2 gap-4 pt-4 min-h-0">
                  {/* Left Column: Current Members */}
                  <div 
                    data-testid="current-members-column"
                    className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Current Members ({draftMemberIds.length})
                      </span>
                    </div>

                    <div className="p-2 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/40">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          data-testid="search-current-members"
                          placeholder="Search members..."
                          value={currentMemberSearch}
                          onChange={(e) => setCurrentMemberSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredCurrentMembers.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-8">
                          No members in this list
                        </div>
                      ) : (
                        filteredCurrentMembers.map((buyer) => (
                          <div
                            key={buyer._id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                {buyer.companyName || buyer.name || buyer.email}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{buyer.email}</div>
                            </div>
                            <button
                              data-testid={`remove-member-${buyer._id}`}
                              onClick={() => buyer._id && handleRemoveMember(buyer._id)}
                              className="p-1 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded border border-rose-200 dark:border-rose-900/30 transition-colors shrink-0"
                              title="Remove from list"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Available Active Buyers */}
                  <div 
                    data-testid="available-buyers-column"
                    className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        All Active Buyers ({availableBuyersList.length})
                      </span>
                    </div>

                    <div className="p-2 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/40">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          data-testid="search-available-buyers"
                          placeholder="Search available buyers..."
                          value={availableBuyerSearch}
                          onChange={(e) => setAvailableBuyerSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredAvailableBuyers.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-8">
                          No available buyers
                        </div>
                      ) : (
                        filteredAvailableBuyers.map((buyer) => (
                          <div
                            key={buyer._id}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                {buyer.companyName || buyer.name || buyer.email}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">{buyer.email}</div>
                            </div>
                            <button
                              data-testid={`add-member-${buyer._id}`}
                              onClick={() => buyer._id && handleAddMember(buyer._id)}
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded border border-emerald-200 dark:border-emerald-900/30 transition-colors shrink-0"
                              title="Add to list"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Select a list to view members
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
