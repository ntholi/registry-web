import {
	DeleteObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

export async function uploadFile(
	input: File | Blob | Buffer,
	key: string,
	contentType?: string
): Promise<string> {
	const body = Buffer.isBuffer(input)
		? input
		: Buffer.from(await input.arrayBuffer());
	const type =
		contentType ||
		(input instanceof File ? input.type : 'application/octet-stream');

	await s3Client.send(
		new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: type,
			ACL: 'public-read',
		})
	);

	return key;
}

export async function deleteFile(key: string): Promise<void> {
	if (!key) throw new Error('No key provided');

	await s3Client.send(
		new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		})
	);
}

export async function fileExists(key: string): Promise<boolean> {
	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
			})
		);
		return true;
	} catch {
		return false;
	}
}
