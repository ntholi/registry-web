import '../src/core/database/env-load';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { isNotNull } from 'drizzle-orm';
import {
	db,
	documents,
	employees,
	publicationAttachments,
	students,
} from '@/core/database';

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 50;

const s3 = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

interface VerifyResult {
	phase: string;
	total: number;
	found: number;
	missing: string[];
	errors: string[];
}

async function headObject(key: string): Promise<'found' | 'missing' | 'error'> {
	try {
		await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
		return 'found';
	} catch (err: unknown) {
		const code = (err as { name?: string }).name;
		if (code === 'NotFound' || code === '404') return 'missing';
		return 'error';
	}
}

async function delay(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

async function verifyKeys(
	phase: string,
	keys: string[]
): Promise<VerifyResult> {
	const result: VerifyResult = {
		phase,
		total: keys.length,
		found: 0,
		missing: [],
		errors: [],
	};
	for (let i = 0; i < keys.length; i += BATCH_SIZE) {
		const batch = keys.slice(i, i + BATCH_SIZE);
		const results = await Promise.all(batch.map((k) => headObject(k)));
		for (let j = 0; j < results.length; j++) {
			const status = results[j];
			const key = batch[j];
			if (status === 'found') result.found++;
			else if (status === 'missing') result.missing.push(key);
			else result.errors.push(key);
		}
		const done = Math.min(i + BATCH_SIZE, keys.length);
		process.stdout.write(`\r  ${phase}: ${done}/${keys.length}`);
		if (i + BATCH_SIZE < keys.length) await delay(BATCH_DELAY_MS);
	}
	console.log();
	return result;
}

async function main() {
	console.log('R2 Migration Verification\n');

	const studentRows = await db
		.select({ photoKey: students.photoKey })
		.from(students)
		.where(isNotNull(students.photoKey));
	const studentKeys = studentRows.map((r) => r.photoKey!);
	const studentResult = await verifyKeys('Student Photos', studentKeys);

	const employeeRows = await db
		.select({ photoKey: employees.photoKey })
		.from(employees)
		.where(isNotNull(employees.photoKey));
	const employeeKeys = employeeRows.map((r) => r.photoKey!);
	const employeeResult = await verifyKeys('Employee Photos', employeeKeys);

	const docRows = await db
		.select({ fileUrl: documents.fileUrl })
		.from(documents)
		.where(isNotNull(documents.fileUrl));
	const docKeys = docRows
		.map((r) => r.fileUrl!)
		.filter((k) => k && !k.startsWith('data:') && !k.startsWith('http'));
	const docResult = await verifyKeys('Documents', docKeys);

	const attRows = await db
		.select({ storageKey: publicationAttachments.storageKey })
		.from(publicationAttachments)
		.where(isNotNull(publicationAttachments.storageKey));
	const attKeys = attRows.map((r) => r.storageKey!);
	const attResult = await verifyKeys('Publication Attachments', attKeys);

	console.log('\n=== Summary ===');
	const all = [studentResult, employeeResult, docResult, attResult];
	for (const r of all) {
		const status =
			r.missing.length === 0 && r.errors.length === 0 ? 'PASS' : 'FAIL';
		console.log(
			`${status} ${r.phase}: ${r.found}/${r.total} found, ${r.missing.length} missing, ${r.errors.length} errors`
		);
		if (r.missing.length > 0) {
			console.log(`  Missing keys (first 10):`);
			for (const k of r.missing.slice(0, 10)) console.log(`    - ${k}`);
		}
		if (r.errors.length > 0) {
			console.log(`  Error keys (first 10):`);
			for (const k of r.errors.slice(0, 10)) console.log(`    - ${k}`);
		}
	}

	const totalMissing = all.reduce((s, r) => s + r.missing.length, 0);
	const totalErrors = all.reduce((s, r) => s + r.errors.length, 0);
	console.log(`\nOverall: ${totalMissing} missing, ${totalErrors} errors`);

	process.exit(totalMissing + totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
	console.error('Verification failed:', err);
	process.exit(1);
});
