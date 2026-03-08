import '../src/core/database/env-load';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	DeleteObjectsCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from '@aws-sdk/client-s3';

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const BATCH_DELETE_SIZE = 500;

const s3 = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

const OLD_PREFIXES = [
	'photos/',
	'documents/admissions/',
	'documents/registry/',
	'documents/library/',
];

const _NEW_PREFIXES = [
	'registry/',
	'human-resource/',
	'admissions/',
	'library/',
];

const isDryRun = process.argv.includes('--dry-run');

async function listObjects(prefix: string) {
	const objects: { Key: string; Size: number }[] = [];
	let token: string | undefined;
	do {
		const res = await s3.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_NAME,
				Prefix: prefix,
				ContinuationToken: token,
			})
		);
		for (const obj of res.Contents || []) {
			if (obj.Key) objects.push({ Key: obj.Key, Size: obj.Size || 0 });
		}
		token = res.NextContinuationToken;
	} while (token);
	return objects;
}

async function _headObject(key: string): Promise<boolean> {
	try {
		await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
		return true;
	} catch {
		return false;
	}
}

async function batchDelete(keys: string[]) {
	for (let i = 0; i < keys.length; i += BATCH_DELETE_SIZE) {
		const batch = keys.slice(i, i + BATCH_DELETE_SIZE);
		await s3.send(
			new DeleteObjectsCommand({
				Bucket: BUCKET_NAME,
				Delete: {
					Objects: batch.map((Key) => ({ Key })),
					Quiet: true,
				},
			})
		);
		process.stdout.write(
			`\r  Deleted ${Math.min(i + BATCH_DELETE_SIZE, keys.length)}/${keys.length}`
		);
	}
	console.log();
}

async function main() {
	console.log(
		`R2 Cleanup — Old Object Deletion${isDryRun ? ' [DRY RUN]' : ''}\n`
	);

	const stats = {
		total: 0,
		deleted: 0,
		alreadyGone: 0,
		errors: 0,
		skippedOrphaned: 0,
	};
	const toDelete: string[] = [];

	for (const prefix of OLD_PREFIXES) {
		console.log(`Scanning prefix: ${prefix}`);
		const objects = await listObjects(prefix);
		console.log(`  Found ${objects.length} objects`);
		stats.total += objects.length;

		for (const obj of objects) {
			if (obj.Key.includes('/orphaned/')) {
				stats.skippedOrphaned++;
				continue;
			}
			toDelete.push(obj.Key);
		}
	}

	console.log(`\nTotal old objects: ${stats.total}`);
	console.log(`Eligible for deletion: ${toDelete.length}`);
	console.log(`Skipped (orphaned): ${stats.skippedOrphaned}`);

	if (isDryRun) {
		console.log('\n[DRY RUN] Would delete these objects:');
		for (const key of toDelete.slice(0, 20)) console.log(`  ${key}`);
		if (toDelete.length > 20)
			console.log(`  ... and ${toDelete.length - 20} more`);
		console.log('\nRe-run without --dry-run to actually delete.');
	} else {
		if (toDelete.length === 0) {
			console.log('Nothing to delete.');
		} else {
			console.log(`\nDeleting ${toDelete.length} objects...`);
			await batchDelete(toDelete);
			stats.deleted = toDelete.length;
			console.log(`Deleted: ${stats.deleted}`);
		}
	}

	const logDir = path.join(__dirname, 'migration-logs');
	if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const logPath = path.join(logDir, `r2-cleanup-${timestamp}.json`);
	fs.writeFileSync(
		logPath,
		JSON.stringify(
			{
				timestamp: new Date().toISOString(),
				dryRun: isDryRun,
				stats,
				deletedKeys: isDryRun ? [] : toDelete,
				eligibleKeys: isDryRun ? toDelete : [],
			},
			null,
			2
		)
	);
	console.log(`\nLog saved to ${logPath}`);
}

main().catch((err) => {
	console.error('Cleanup failed:', err);
	process.exit(1);
});
