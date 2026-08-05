import mongoose from 'mongoose';
import { s3, sqs } from '../utils/aws';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { ListQueuesCommand } from '@aws-sdk/client-sqs';
import { getRedisClient } from '../utils/redis';

describe('Infrastructure Connection Integration Tests', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should successfully connect to Redis and ping the server', async () => {
    const redisClient = await getRedisClient();
    expect(redisClient).not.toBeNull();
    if (redisClient) {
      const pong = await redisClient.ping();
      expect(pong).toBe('PONG');
    }
  });

  it('should successfully connect to LocalStack S3 and list buckets', async () => {
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);
    expect(response.$metadata.httpStatusCode).toBe(200);
    expect(response.Buckets).toBeDefined();
    
    // Check if the ind-spoiler-alert-surplus bucket exists
    const bucketNames = response.Buckets?.map(b => b.Name) || [];
    expect(bucketNames).toContain('ind-spoiler-alert-surplus');
  });

  it('should successfully connect to LocalStack SQS and list queues', async () => {
    const command = new ListQueuesCommand({});
    const response = await sqs.send(command);
    expect(response.$metadata.httpStatusCode).toBe(200);
    expect(response.QueueUrls).toBeDefined();
    
    // Check if the ind-spoiler-alert-ingestion-jobs queue exists
    const queueUrls = response.QueueUrls || [];
    const hasIngestionQueue = queueUrls.some(url => url.includes('ind-spoiler-alert-ingestion-jobs'));
    expect(hasIngestionQueue).toBe(true);
  });
});
