import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';
import fs from 'fs';

const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:4566';
const sqsEndpoint = process.env.SQS_ENDPOINT || 'http://localhost:4566';
const region = process.env.AWS_REGION || 'us-east-1';

export const s3 = new S3Client({
  endpoint: s3Endpoint,
  forcePathStyle: true,
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export const sqs = new SQSClient({
  endpoint: sqsEndpoint,
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

export async function uploadToS3(filePath: string, bucket: string, key: string): Promise<void> {
  const fileBuffer = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
  });
  await s3.send(command);
}

export async function sendSQSMessage(queueName: string, messageBody: any): Promise<void> {
  try {
    const getUrlCommand = new GetQueueUrlCommand({ QueueName: queueName });
    const { QueueUrl } = await sqs.send(getUrlCommand);
    if (!QueueUrl) {
      throw new Error(`Queue URL not found for queue ${queueName}`);
    }
    const sendCommand = new SendMessageCommand({
      QueueUrl,
      MessageBody: JSON.stringify(messageBody),
    });
    await sqs.send(sendCommand);
  } catch (err: any) {
    console.error('Error sending SQS message:', err.message || err);
    throw err;
  }
}
