'use server';

import { auth } from '@/auth';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { unauthorized } from 'next/navigation';

const s3Client = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  region: 'weur',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

export async function uploadDocument(
  file: File | Blob,
  fileName: string,
  folder: string
) {
  const session = await auth();
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    if (!file || !(file instanceof File)) {
      throw new Error(`Invalid file input, file: ${file}`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const fName = fileName || `${nanoid()}.${ext}`;
    const key = `${folder}/${fName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read',
      })
    );

    return key;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function deleteDocument(url: string | undefined | null) {
  const session = await auth();
  if (!session || !session.user) {
    return unauthorized();
  }

  try {
    const fileName = url ? formatUrl(url) : null;
    if (!fileName) throw new Error('Invalid URL format');

    const res = await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      })
    );
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

function formatUrl(url: string | undefined | null) {
  if (!url) return null;
  const parts = url.split('/');
  return parts[parts.length - 1];
}
