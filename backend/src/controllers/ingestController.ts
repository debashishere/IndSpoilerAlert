import { Request, Response } from 'express';
import * as ingestService from '../services/ingestService';

export async function uploadIngestFile(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const result = await ingestService.queueUploadAndParseFile(
      file.path,
      file.originalname,
      file.mimetype,
      req.body.supplierId
    );
    return res.status(202).json(result);
  } catch (error: any) {
    try {
      const result = await ingestService.uploadAndParseFile(
        file.path,
        file.originalname,
        file.mimetype,
        req.body.supplierId
      );
      return res.status(200).json(result);
    } catch (fallbackError: any) {
      return res.status(500).json({
        error: 'Failed to enqueue or parse document for ingestion.',
        details: fallbackError.message || fallbackError
      });
    }
  }
}

export async function getJobStatus(req: Request, res: Response) {
  try {
    const result = await ingestService.getIngestionJobStatus(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
}

export async function ingestCallback(req: Request, res: Response) {
  try {
    const result = await ingestService.handleIngestCallback(req.body);
    return res.status(200).json({ success: true, job: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function confirmIngest(req: Request, res: Response) {
  const documentId = req.body.documentId || req.body._id || req.body.ingestionJobId || req.body.jobId;
  const { supplierId, mappings, saveTemplate, templateName, semanticRules } = req.body;
  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required.' });
  }
  if (!supplierId) {
    return res.status(400).json({ error: 'supplierId is required.' });
  }
  if (!mappings) {
    return res.status(400).json({ error: 'mappings object is required.' });
  }

  try {
    const result = await ingestService.confirmIngestion(
      documentId,
      supplierId,
      mappings,
      saveTemplate,
      templateName,
      semanticRules
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error confirming import:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function confirmSalesIngest(req: Request, res: Response) {
  const documentId = req.body.documentId || req.body._id || req.body.ingestionJobId || req.body.jobId;
  const { supplierId, mappings, saveTemplate, templateName } = req.body;
  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required.' });
  }
  if (!supplierId) {
    return res.status(400).json({ error: 'supplierId is required.' });
  }
  if (!mappings) {
    return res.status(400).json({ error: 'mappings object is required.' });
  }

  try {
    const result = await ingestService.confirmSalesIngestion(
      documentId,
      supplierId,
      mappings,
      saveTemplate,
      templateName
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error confirming sales import:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function confirmBuyerIngest(req: Request, res: Response) {
  const documentId = req.body.documentId || req.body._id || req.body.ingestionJobId || req.body.jobId;
  const { mappings, buyerListId } = req.body;
  if (!documentId) {
    return res.status(400).json({ error: 'documentId is required.' });
  }
  if (!mappings) {
    return res.status(400).json({ error: 'mappings object is required.' });
  }

  try {
    const result = await ingestService.confirmBuyerIngestion(
      documentId,
      mappings,
      buyerListId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error confirming buyer import:', error);
    return res.status(500).json({ error: error.message });
  }
}



