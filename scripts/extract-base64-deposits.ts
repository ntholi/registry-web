import '../src/core/database/env-load';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { bankDeposits, db, documents } from '@/core/database';
import { uploadFile } from '@/core/integrations/storage';
import { StoragePaths } from '@/core/integrations/storage-utils';

const DEFAULT_BATCH_SIZE = 50;
const BATCH_DELAY_MS = 100;
const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const s3 = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

interface DepositDocRow {
	docId: string;
	fileName: string;
	fileUrl: string | null;
	applicationId: string | null;
}

interface DepositCandidate {
	docId: string;
	fileName: string;
	fileUrl: string;
	applicationId: string;
}

interface FailureEntry {
	docId: string;
	applicationId: string | null;
	reason: string;
	timestamp: string;
}

interface SkippedEntry {
	docId: string;
	applicationId: string | null;
	reason: string;
	timestamp: string;
}

interface MigrationLog {
	startedAt: string;
	completedAt: string;
	total: number;
	success: number;
	skipped: number;
	failed: number;
	totalBytesUploaded: number;
	dbBytesReplaced: number;
	dbSizeReclaimedEstimate: string;
	failures: FailureEntry[];
	skippedEntries: SkippedEntry[];
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const BATCH_SIZE = parseBatchSizeArg(args);

const log: MigrationLog = {
	startedAt: new Date().toISOString(),
	completedAt: '',
	total: 0,
	success: 0,
	skipped: 0,
	failed: 0,
	totalBytesUploaded: 0,
	dbBytesReplaced: 0,
	dbSizeReclaimedEstimate: '0 B',
	failures: [],
	skippedEntries: [],
};

function parseBatchSizeArg(argv: string[]): number {
	const idx = argv.indexOf('--batch-size');
	const raw =
		idx !== -1 && idx + 1 < argv.length
			? argv[idx + 1]
			: argv.find((arg) => arg.startsWith('--batch-size='))?.split('=')[1];
	const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_BATCH_SIZE;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BATCH_SIZE;
}

function parseDataUri(dataUri: string): { mediaType: string; base64: string } {
	const match = dataUri.match(/^data:([^;]+);base64,([\s\S]+)$/);
	if (!match) {
		throw new Error(`Invalid data URI: ${dataUri.slice(0, 50)}...`);
	}
	return { mediaType: match[1], base64: match[2] };
}

function mimeToExt(mediaType: string): string {
	const map: Record<string, string> = {
		'image/jpeg': 'jpeg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/heic': 'heic',
		'image/heif': 'heif',
		'application/pdf': 'pdf',
	};
	return map[mediaType] || mediaType.split('/')[1] || 'bin';
}

function formatBytes(bytes: number): string {
	if (bytes <= 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

async function headObject(key: string) {
	const response = await s3.send(
		new HeadObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		})
	);

	return {
		contentLength: response.ContentLength ?? 0,
		contentType: response.ContentType ?? '',
		etag: response.ETag?.replaceAll('"', '') || '',
	};
}

async function processBatch<T>(
	items: T[],
	processor: (item: T) => Promise<void>
) {
	for (let index = 0; index < items.length; index += BATCH_SIZE) {
		const batch = items.slice(index, index + BATCH_SIZE);
		await Promise.allSettled(batch.map(processor));
		if (index + BATCH_SIZE < items.length) {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
		}
	}
}

function pushFailure(
	docId: string,
	applicationId: string | null,
	reason: string
): void {
	log.failed += 1;
	log.failures.push({
		docId,
		applicationId,
		reason,
		timestamp: new Date().toISOString(),
	});
}

function pushSkipped(
	docId: string,
	applicationId: string | null,
	reason: string
): void {
	log.skipped += 1;
	log.skippedEntries.push({
		docId,
		applicationId,
		reason,
		timestamp: new Date().toISOString(),
	});
}

async function loadDepositDocs(): Promise<DepositDocRow[]> {
	return db
		.select({
			docId: documents.id,
			fileName: documents.fileName,
			fileUrl: documents.fileUrl,
			applicationId: bankDeposits.applicationId,
		})
		.from(documents)
		.leftJoin(bankDeposits, eq(bankDeposits.documentId, documents.id))
		.where(eq(documents.type, 'proof_of_payment'));
}

async function migrateCandidate(candidate: DepositCandidate): Promise<void> {
	let parsed: { mediaType: string; base64: string };

	try {
		parsed = parseDataUri(candidate.fileUrl);
	} catch (error) {
		pushFailure(
			candidate.docId,
			candidate.applicationId,
			error instanceof Error ? error.message : 'Failed to parse data URI'
		);
		return;
	}

	const buffer = Buffer.from(parsed.base64, 'base64');
	const ext = mimeToExt(parsed.mediaType);
	const key = StoragePaths.admissionDeposit(
		candidate.applicationId,
		`${candidate.docId}.${ext}`
	);
	const expectedSize = buffer.length;
	const expectedEtag = createHash('md5').update(buffer).digest('hex');
	const sourceSize = Buffer.byteLength(candidate.fileUrl, 'utf8');

	if (DRY_RUN) {
		console.log(
			`  [DRY RUN] Would upload ${candidate.docId} → ${key} (${formatBytes(expectedSize)})`
		);
		console.log(
			`  [DRY RUN] Would UPDATE documents SET file_url='${key}' WHERE id='${candidate.docId}'`
		);
		log.success += 1;
		log.totalBytesUploaded += expectedSize;
		log.dbBytesReplaced += sourceSize;
		return;
	}

	try {
		const existing = await headObject(key).catch(() => null);
		if (
			existing &&
			existing.contentLength === expectedSize &&
			existing.contentType === parsed.mediaType &&
			existing.etag === expectedEtag
		) {
			await db
				.update(documents)
				.set({ fileUrl: key })
				.where(eq(documents.id, candidate.docId));
			console.log(`  Reused existing object for ${candidate.docId}`);
			log.success += 1;
			log.totalBytesUploaded += expectedSize;
			log.dbBytesReplaced += sourceSize;
			return;
		}

		await uploadFile(buffer, key, parsed.mediaType);
		const uploaded = await headObject(key);

		if (uploaded.contentLength !== expectedSize) {
			pushFailure(
				candidate.docId,
				candidate.applicationId,
				`Size mismatch: expected ${expectedSize}, got ${uploaded.contentLength}`
			);
			return;
		}

		if (uploaded.contentType !== parsed.mediaType) {
			pushFailure(
				candidate.docId,
				candidate.applicationId,
				`Content type mismatch: expected ${parsed.mediaType}, got ${uploaded.contentType}`
			);
			return;
		}

		if (uploaded.etag && uploaded.etag !== expectedEtag) {
			pushFailure(
				candidate.docId,
				candidate.applicationId,
				`Checksum mismatch: expected ${expectedEtag}, got ${uploaded.etag}`
			);
			return;
		}

		await db
			.update(documents)
			.set({ fileUrl: key })
			.where(eq(documents.id, candidate.docId));

		console.log(`  Migrated ${candidate.docId} → ${key}`);
		log.success += 1;
		log.totalBytesUploaded += expectedSize;
		log.dbBytesReplaced += sourceSize;
	} catch (error) {
		pushFailure(
			candidate.docId,
			candidate.applicationId,
			error instanceof Error ? error.message : 'Upload failed'
		);
	}
}

async function main(): Promise<void> {
	console.log('╔══════════════════════════════════════════╗');
	console.log('║     Base64 Deposit Extraction Script     ║');
	console.log('╚══════════════════════════════════════════╝');
	console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
	console.log(`Batch size: ${BATCH_SIZE}`);
	console.log(`Bucket: ${BUCKET_NAME}`);
	console.log('');

	const rows = await loadDepositDocs();
	log.total = rows.length;
	console.log(`Loaded ${rows.length} proof_of_payment records`);

	const candidates: DepositCandidate[] = [];

	for (const row of rows) {
		if (!row.fileUrl) {
			pushSkipped(row.docId, row.applicationId, 'fileUrl is null');
			continue;
		}

		if (!row.fileUrl.startsWith('data:')) {
			pushSkipped(
				row.docId,
				row.applicationId,
				'already migrated or not base64'
			);
			continue;
		}

		if (!row.applicationId) {
			pushFailure(row.docId, row.applicationId, 'missing bank deposit link');
			continue;
		}

		candidates.push({
			docId: row.docId,
			fileName: row.fileName,
			fileUrl: row.fileUrl,
			applicationId: row.applicationId,
		});
	}

	console.log(`Migratable base64 records: ${candidates.length}`);
	console.log(`Pre-skipped records: ${log.skipped}`);
	console.log(`Pre-failed records: ${log.failed}`);

	await processBatch(candidates, migrateCandidate);

	log.completedAt = new Date().toISOString();
	log.dbSizeReclaimedEstimate = formatBytes(log.dbBytesReplaced);

	console.log('\n╔══════════════════════════════════════════╗');
	console.log('║              Summary Report              ║');
	console.log('╚══════════════════════════════════════════╝');
	console.log(`  Total records: ${log.total}`);
	console.log(`  Success: ${log.success}`);
	console.log(`  Skipped: ${log.skipped}`);
	console.log(`  Failed: ${log.failed}`);
	console.log(`  Uploaded bytes: ${formatBytes(log.totalBytesUploaded)}`);
	console.log(`  DB bytes replaced: ${formatBytes(log.dbBytesReplaced)}`);

	const logDir = path.resolve(process.cwd(), 'scripts/logs');
	fs.mkdirSync(logDir, { recursive: true });
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const logPath = path.join(logDir, `base64-extraction-${timestamp}.json`);
	fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
	console.log(`\nLog written to: ${logPath}`);
}

main()
	.then(() => {
		console.log('\nDone.');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Extraction failed:', error);
		process.exit(1);
	});
