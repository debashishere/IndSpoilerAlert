import { useState, useEffect, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  setPipelineTab,
  uploadInventoryThunk,
  uploadSalesThunk,
  uploadBuyerThunk,
  type PipelineTab
} from '../../../../store/slices/ingestionSlice';
import { DEFAULT_SUPPLIERS } from '../../../../services/coreService';
import { INGESTION_CONSTANTS } from '../constants/ingestionConstants';
import type { UnifiedIngestionModalProps, IngestionTarget } from '../types/ingestion.types';

export const useUnifiedIngestionModal = ({
  isOpen,
  onClose,
  initialTarget = 'inventory',
  onIngestComplete,
}: UnifiedIngestionModalProps) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actualFileRef = useRef<File | null>(null);

  const [target, setTarget] = useState<IngestionTarget>(initialTarget);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync internal target when initialTarget or modal visibility changes
  useEffect(() => {
    if (initialTarget) {
      setTarget(initialTarget);
    }
  }, [initialTarget, isOpen]);

  const suppliers = useAppSelector((state) => state.core.suppliers);
  const selectedSupplier = useAppSelector((state) => state.ingestion.selectedSupplier);
  const availableSuppliers = suppliers.length > 0 ? suppliers : DEFAULT_SUPPLIERS;
  const effectiveSupplierId = selectedSupplier || (availableSuppliers.length > 0 ? (availableSuppliers[0]._id || '') : '');

  const handleSelectTarget = useCallback((newTarget: IngestionTarget) => {
    setTarget(newTarget);
    setErrorMessage(null);
  }, []);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      actualFileRef.current = file;
      setSelectedFile(file);
      setErrorMessage(null);
    }
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      actualFileRef.current = file;
      setSelectedFile(file);
      setErrorMessage(null);
    }
  }, []);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = useCallback(async () => {
    const file = actualFileRef.current || selectedFile;
    if (!file) {
      setErrorMessage('Please select a file to ingest.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Dismiss the modal first or immediately upon dispatching
      onClose();

      // 2. Transition active pipeline tab to target
      dispatch(setPipelineTab(target as PipelineTab));

      // 3. Dispatch appropriate ingestion thunk
      if (target === 'inventory') {
        await dispatch(uploadInventoryThunk({ file, supplierId: effectiveSupplierId }));
      } else if (target === 'sales') {
        await dispatch(uploadSalesThunk({ file, supplierId: effectiveSupplierId }));
      } else if (target === 'buyers') {
        await dispatch(uploadBuyerThunk({ file, supplierId: effectiveSupplierId || undefined }));
      }

      if (onIngestComplete) {
        onIngestComplete(target, file);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse dataset.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFile, target, onClose, dispatch, effectiveSupplierId, onIngestComplete]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    actualFileRef.current = null;
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  return {
    target,
    selectedFile,
    dragActive,
    isSubmitting,
    errorMessage,
    fileInputRef,
    handleSelectTarget,
    handleDrag,
    handleDrop,
    handleFileChange,
    triggerFileSelect,
    formatFileSize,
    handleSubmit,
    handleClose,
  };
};
