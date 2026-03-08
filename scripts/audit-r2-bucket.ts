import '../src/core/database/env-load';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const s3 = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

const EXPECTED_PREFIXES = new Set([
	'registry/',
	'human-resource/',
	'admissions/',
	'library/',
]);

async function main() {
	console.log('R2 Bucket Audit\n');

	const objects: { Key: string; Size: number }[] = [];
	let token: string | undefined;
	do {
		const res = await s3.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_NAME,
				ContinuationToken: token,
			})
		);
		for (const obj of res.Contents || []) {
			if (obj.Key) objects.push({ Key: obj.Key, Size: obj.Size || 0 });
		}
		token = res.NextContinuationToken;
	} while (token);

	const groups = new Map<string, { count: number; size: number }>();
	const unexpected: string[] = [];

	for (const obj of objects) {
		const parts = obj.Key.split('/');
		const topLevel = `${parts[0]}/`;

		const groupKey =
			parts.length >= 3 ? `${parts[0]}/${parts[1]}/${parts[2]}/` : topLevel;

		const existing = groups.get(groupKey) || { count: 0, size: 0 };
		existing.count++;
		existing.size += obj.Size;
		groups.set(groupKey, existing);

		if (!EXPECTED_PREFIXES.has(topLevel)) {
			unexpected.push(obj.Key);
		}
	}

	const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
	for (const [prefix, { count, size }] of sorted) {
		const sizeMB = (size / 1024 / 1024).toFixed(1);
		console.log(
			`${prefix.padEnd(50)} ${String(count).padStart(6)} objects  ${sizeMB.padStart(8)} MB`
		);
	}

	console.log('---');
	console.log(`Total: ${objects.length} objects`);
	console.log(`Unexpected: ${unexpected.length} objects`);

	if (unexpected.length > 0) {
		console.log('\nUnexpected objects (first 20):');
		for (const key of unexpected.slice(0, 20)) console.log(`  ${key}`);
		if (unexpected.length > 20)
			console.log(`  ... and ${unexpected.length - 20} more`);
	}

	const logDir = path.join(__dirname, 'migration-logs');
	if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const logPath = path.join(logDir, `r2-audit-${timestamp}.json`);
	fs.writeFileSync(
		logPath,
		JSON.stringify(
			{
				timestamp: new Date().toISOString(),
				totalObjects: objects.length,
				unexpectedCount: unexpected.length,
				groups: Object.fromEntries(sorted),
				unexpectedKeys: unexpected,
				allKeys: objects.map((o) => o.Key),
			},
			null,
			2
		)
	);
	console.log(`\nFull listing saved to ${logPath}`);
}

main().catch((err) => {
	console.error('Audit failed:', err);
	process.exit(1);
});
