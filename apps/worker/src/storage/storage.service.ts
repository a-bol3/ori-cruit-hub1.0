import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9002';
    const useSsl = process.env.MINIO_USE_SSL === 'true';

    this.bucket = process.env.MINIO_BUCKET_DOCUMENTS || 'candidate-documents';

    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
    });
  }

  buildDocumentObjectKey(params: {
    candidateId?: string | null;
    documentId: string;
    versionNumber: number;
    extension?: string | null;
  }) {
    const safeCandidateId = params.candidateId || 'unresolved';
    const ext = params.extension || 'bin';
    return `documents/${safeCandidateId}/${params.documentId}/v${params.versionNumber}.${ext}`;
  }

  async uploadObject(params: {
    bucket?: string;
    objectKey: string;
    body: Buffer;
    mimeType?: string;
  }) {
    const targetBucket = params.bucket || this.bucket;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: params.objectKey,
        Body: params.body,
        ContentType: params.mimeType,
      }),
    );

    return { bucket: targetBucket, objectKey: params.objectKey };
  }

  async deleteObject(objectKey: string, bucket?: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: bucket || this.bucket,
        Key: objectKey,
      }),
    );
  }

  async getSignedUrl(objectKey: string, bucket?: string, expiresInSeconds = 900) {
    const command = new GetObjectCommand({
      Bucket: bucket || this.bucket,
      Key: objectKey,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
