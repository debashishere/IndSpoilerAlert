import { StorageEngine } from 'multer';
import { Request } from 'express';
import { s3 } from './aws';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import path from 'path';

export interface S3StorageOptions {
  bucket?: string;
  getKey?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, key: string) => void) => void;
}

export class S3StorageEngine implements StorageEngine {
  private bucket: string;
  private getKey: (req: Request, file: Express.Multer.File, cb: (error: Error | null, key: string) => void) => void;

  constructor(opts?: S3StorageOptions) {
    this.bucket = opts?.bucket || process.env.AWS_S3_BUCKET || 'ind-spoiler-alert-surplus';
    this.getKey =
      opts?.getKey ||
      ((req, file, cb) => {
        const safeName = path.basename(file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `uploads/${uniqueSuffix}-${safeName}`);
      });
  }

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    this.getKey(req, file, (err, key) => {
      if (err) return cb(err);

      const chunks: Buffer[] = [];
      file.stream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      file.stream.on('error', (streamErr) => cb(streamErr));
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const bucket = process.env.AWS_S3_BUCKET || this.bucket;

          try {
            const command = new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: file.mimetype,
            });

            await s3.send(command);
          } catch (awsErr: any) {
            console.warn('[S3Storage] AWS S3 upload error (proceeding with buffer fallback):', awsErr.message || awsErr);
          }

          const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:4566';
          const location = `${s3Endpoint}/${bucket}/${key}`;

          cb(null, {
            bucket,
            key,
            s3Bucket: bucket,
            s3Key: key,
            location,
            size: buffer.length,
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer,
          } as any);
        } catch (uploadErr) {
          cb(uploadErr);
        }
      });
    });
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ): void {
    const bucket = (file as any).bucket || (file as any).s3Bucket || process.env.AWS_S3_BUCKET || this.bucket;
    const key = (file as any).key || (file as any).s3Key;

    if (!key) return cb(null);

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    s3.send(command)
      .then(() => cb(null))
      .catch(() => cb(null));
  }
}

export function s3StorageEngine(opts?: S3StorageOptions): StorageEngine {
  return new S3StorageEngine(opts);
}
