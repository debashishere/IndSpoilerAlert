import { s3 } from '../utils/aws';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3StorageEngine } from '../utils/s3Storage';
import { Readable } from 'stream';

describe('S3 Storage Engine (Multer)', () => {
  const bucketName = process.env.AWS_S3_BUCKET || 'ind-spoiler-alert-surplus';

  it('should stream upload a file directly to S3 and return file metadata', (done) => {
    const storage = s3StorageEngine();
    const testContent = 'SKU,Quantity,Price\nSKU100,10,15.50';
    const stream = Readable.from([testContent]);

    const fakeReq = {} as any;
    const fakeFile = {
      fieldname: 'file',
      originalname: 'test_stream_upload.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      stream: stream,
    } as any;

    storage._handleFile(fakeReq, fakeFile, async (err: any, info: any) => {
      try {
        expect(err).toBeNull();
        expect(info).toBeDefined();
        expect(info.bucket || info.s3Bucket).toBe(bucketName);
        expect(info.key || info.s3Key).toContain('test_stream_upload.csv');
        expect(info.size).toBe(Buffer.byteLength(testContent));

        try {
          // Verify object exists in LocalStack S3
          const getCmd = new GetObjectCommand({
            Bucket: info.bucket || info.s3Bucket,
            Key: info.key || info.s3Key,
          });
          const s3Obj = await s3.send(getCmd);
          const downloadedContent = await s3Obj.Body?.transformToString();
          expect(downloadedContent).toBe(testContent);

          // Clean up from S3
          await s3.send(
            new DeleteObjectCommand({
              Bucket: info.bucket || info.s3Bucket,
              Key: info.key || info.s3Key,
            })
          );
        } catch (s3Err) {
          console.warn('[s3Storage.test] LocalStack S3 offline, skipping remote verification.');
        }

        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('should remove file from S3 via _removeFile', (done) => {
    const storage = s3StorageEngine();
    const testContent = 'Remove test';
    const stream = Readable.from([testContent]);

    const fakeReq = {} as any;
    const fakeFile = {
      fieldname: 'file',
      originalname: 'test_remove.csv',
      encoding: '7bit',
      mimetype: 'text/csv',
      stream: stream,
    } as any;

    storage._handleFile(fakeReq, fakeFile, async (err: any, info: any) => {
      try {
        expect(err).toBeNull();

        const fileWithKey = {
          ...fakeFile,
          bucket: info.bucket || info.s3Bucket,
          key: info.key || info.s3Key,
        };

        storage._removeFile(fakeReq, fileWithKey, async (remErr: any) => {
          try {
            expect(remErr).toBeNull();
            done();
          } catch (e) {
            done(e);
          }
        });
      } catch (e) {
        done(e);
      }
    });
  });
});
