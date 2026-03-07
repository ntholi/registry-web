import '../src/core/database/env-load';
import {
	CopyObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from '@aws-sdk/client-s3';
import { and, eq, isNull, like, sql } from 'drizzle-orm';
import {
	applicantDocuments,
	bankDeposits,
	db,
	documents,
	employees,
	publicationAttachments,
	studentDocuments,
	students,
} from '@/core/database';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100;
const BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const s3 = new S3Client({
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
	},
	region: 'weur',
});

type Phase =
	| 'studentPhotos'
	| 'employeePhotos'
	| 'admissionsDocuments'
	| 'studentDocuments'
	| 'termPublications'
	| 'libraryResources';

interface PhaseStats {
	total: number;
	copied: number;
	skipped: number;
	failed: number;
	orphaned: number;
	duplicates: number;
}

interface FailureEntry {
	oldKey: string;
	newKey: string;
	error: string;
	timestamp: string;
}

interface OrphanEntry {
	key: string;
	movedTo: string;
	reason: string;
}

interface MigrationLog {
	startedAt: string;
	completedAt: string;
	phases: Record<Phase, PhaseStats>;
	failures: FailureEntry[];
	orphaned: OrphanEntry[];
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function parsePhaseArg(): string {
	const idx = args.indexOf('--phase');
	if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
	const eqArg = args.find((a) => a.startsWith('--phase='));
	if (eqArg) return eqArg.split('=')[1];
	return 'all';
}
const phaseArg = parsePhaseArg();

function emptyStats(): PhaseStats {
	return {
		total: 0,
		copied: 0,
		skipped: 0,
		failed: 0,
		orphaned: 0,
		duplicates: 0,
	};
}

const log: MigrationLog = {
	startedAt: new Date().toISOString(),
	completedAt: '',
	phases: {
		studentPhotos: emptyStats(),
		employeePhotos: emptyStats(),
		admissionsDocuments: emptyStats(),
		studentDocuments: emptyStats(),
		termPublications: emptyStats(),
		libraryResources: emptyStats(),
	},
	failures: [],
	orphaned: [],
};

async function listObjects(prefix: string): Promise<
	Array<{
		Key: string;
		LastModified: Date;
		Size: number;
	}>
> {
	const results: Array<{ Key: string; LastModified: Date; Size: number }> = [];
	let continuationToken: string | undefined;

	do {
		const resp = await s3.send(
			new ListObjectsV2Command({
				Bucket: BUCKET_NAME,
				Prefix: prefix,
				ContinuationToken: continuationToken,
			})
		);
		for (const obj of resp.Contents || []) {
			if (obj.Key && obj.LastModified != null && obj.Size != null) {
				results.push({
					Key: obj.Key,
					LastModified: obj.LastModified,
					Size: obj.Size,
				});
			}
		}
		continuationToken = resp.NextContinuationToken;
	} while (continuationToken);

	return results;
}

async function headObject(key: string) {
	const resp = await s3.send(
		new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key })
	);
	return {
		ContentLength: resp.ContentLength,
		ContentType: resp.ContentType,
		ETag: resp.ETag,
	};
}

async function copyObject(sourceKey: string, destKey: string) {
	await s3.send(
		new CopyObjectCommand({
			Bucket: BUCKET_NAME,
			CopySource: `${BUCKET_NAME}/${sourceKey}`,
			Key: destKey,
			ACL: 'public-read',
		})
	);
}

type CopyResult = { ok: true; skipped: boolean } | { ok: false; error: string };

async function verifiedCopy(
	oldKey: string,
	newKey: string
): Promise<CopyResult> {
	if (DRY_RUN) {
		console.log(`  [DRY RUN] Would copy: ${oldKey} → ${newKey}`);
		return { ok: true, skipped: false };
	}

	try {
		const existingHead = await headObject(newKey).catch(() => null);
		if (existingHead) {
			const sourceHead = await headObject(oldKey);
			if (
				existingHead.ContentLength === sourceHead.ContentLength &&
				existingHead.ContentType === sourceHead.ContentType &&
				existingHead.ETag === sourceHead.ETag
			) {
				console.log(`  Skipped (already exists): ${newKey}`);
				return { ok: true, skipped: true };
			}
		}
	} catch {
		// destination doesn't exist, proceed with copy
	}

	try {
		await copyObject(oldKey, newKey);
	} catch (err) {
		return { ok: false, error: `CopyObject failed: ${String(err)}` };
	}

	try {
		const [srcHead, dstHead] = await Promise.all([
			headObject(oldKey),
			headObject(newKey),
		]);

		if (srcHead.ContentLength !== dstHead.ContentLength) {
			return {
				ok: false,
				error: `ContentLength mismatch: src=${srcHead.ContentLength} dst=${dstHead.ContentLength}`,
			};
		}
		if (srcHead.ContentType !== dstHead.ContentType) {
			return {
				ok: false,
				error: `ContentType mismatch: src=${srcHead.ContentType} dst=${dstHead.ContentType}`,
			};
		}
		if (srcHead.ETag && dstHead.ETag && srcHead.ETag !== dstHead.ETag) {
			return {
				ok: false,
				error: `ETag mismatch: src=${srcHead.ETag} dst=${dstHead.ETag}`,
			};
		}
	} catch (err) {
		return { ok: false, error: `Verification failed: ${String(err)}` };
	}

	return { ok: true, skipped: false };
}

function extractKeyFromUrl(url: string): string {
	if (url.startsWith('http')) {
		try {
			return new URL(url).pathname.replace(/^\//, '');
		} catch {
			return url.replace(`${BASE_URL}/`, '');
		}
	}
	return url;
}

async function processBatch<T>(
	items: T[],
	processor: (item: T) => Promise<void>
) {
	for (let i = 0; i < items.length; i += BATCH_SIZE) {
		const batch = items.slice(i, i + BATCH_SIZE);
		await Promise.allSettled(batch.map(processor));
		if (i + BATCH_SIZE < items.length) {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
		}
	}
}

// ──────────────────────────────────────────
// Phase 1: Student Photos
// ──────────────────────────────────────────
async function migrateStudentPhotos() {
	console.log('\n═══ Phase 1: Student Photos ═══');
	const stats = log.phases.studentPhotos;

	const objects = await listObjects('photos/');
	const studentObjects = objects.filter(
		(o) => !o.Key.startsWith('photos/employees/')
	);
	stats.total = studentObjects.length;
	console.log(`Found ${studentObjects.length} student photo objects`);

	const allStdNos = await db.select({ stdNo: students.stdNo }).from(students);
	const stdNoSet = new Set(allStdNos.map((s) => s.stdNo));

	const byStdNo = new Map<number, typeof studentObjects>();
	for (const obj of studentObjects) {
		const fileName = obj.Key.replace('photos/', '');
		const dotIdx = fileName.lastIndexOf('.');
		const stdNoStr = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;
		const stdNo = Number(stdNoStr);

		if (Number.isNaN(stdNo)) {
			stats.orphaned++;
			const orphanKey = `registry/students/photos/orphaned/${fileName}`;
			const result = await verifiedCopy(obj.Key, orphanKey);
			if (result.ok) {
				log.orphaned.push({
					key: obj.Key,
					movedTo: orphanKey,
					reason: 'invalid stdNo format',
				});
			}
			continue;
		}

		if (!stdNoSet.has(stdNo)) {
			stats.orphaned++;
			const orphanKey = `registry/students/photos/orphaned/${fileName}`;
			const result = await verifiedCopy(obj.Key, orphanKey);
			if (result.ok) {
				log.orphaned.push({
					key: obj.Key,
					movedTo: orphanKey,
					reason: 'no matching DB record',
				});
			}
			continue;
		}

		const existing = byStdNo.get(stdNo) || [];
		existing.push(obj);
		byStdNo.set(stdNo, existing);
	}

	const items: Array<{
		stdNo: number;
		obj: { Key: string; LastModified: Date };
	}> = [];
	for (const [stdNo, objs] of byStdNo) {
		if (objs.length > 1) {
			stats.duplicates += objs.length - 1;
			objs.sort((a, b) => b.LastModified.getTime() - a.LastModified.getTime());
			console.log(
				`  Duplicate for ${stdNo}: using newest (${objs[0].Key}), skipping ${objs.length - 1} older`
			);
		}
		items.push({ stdNo, obj: objs[0] });
	}

	await processBatch(items, async ({ stdNo, obj }) => {
		const ext = obj.Key.substring(obj.Key.lastIndexOf('.') + 1);
		const newKey = `registry/students/photos/${stdNo}.${ext}`;

		const result = await verifiedCopy(obj.Key, newKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey: obj.Key,
				newKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(students)
				.set({ photoKey: newKey })
				.where(eq(students.stdNo, stdNo));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE students SET photo_key='${newKey}' WHERE std_no=${stdNo}`
			);
		}
		if (result.skipped) stats.skipped++;
		else stats.copied++;
	});

	console.log(
		`  Results: ${stats.copied} copied, ${stats.skipped} skipped, ${stats.failed} failed, ${stats.orphaned} orphaned, ${stats.duplicates} duplicates`
	);
}

// ──────────────────────────────────────────
// Phase 2: Employee Photos
// ──────────────────────────────────────────
async function migrateEmployeePhotos() {
	console.log('\n═══ Phase 2: Employee Photos ═══');
	const stats = log.phases.employeePhotos;

	const objects = await listObjects('photos/employees/');
	stats.total = objects.length;
	console.log(`Found ${objects.length} employee photo objects`);

	const allEmpNos = await db.select({ empNo: employees.empNo }).from(employees);
	const empNoSet = new Set(allEmpNos.map((e) => e.empNo));

	const byEmpNo = new Map<string, typeof objects>();
	for (const obj of objects) {
		const fileName = obj.Key.replace('photos/employees/', '');
		const dotIdx = fileName.lastIndexOf('.');
		const empNo = dotIdx >= 0 ? fileName.substring(0, dotIdx) : fileName;

		if (!empNoSet.has(empNo)) {
			stats.orphaned++;
			const orphanKey = `human-resource/employees/photos/orphaned/${fileName}`;
			const result = await verifiedCopy(obj.Key, orphanKey);
			if (result.ok) {
				log.orphaned.push({
					key: obj.Key,
					movedTo: orphanKey,
					reason: 'no matching DB record',
				});
			}
			continue;
		}

		const existing = byEmpNo.get(empNo) || [];
		existing.push(obj);
		byEmpNo.set(empNo, existing);
	}

	const items: Array<{
		empNo: string;
		obj: { Key: string; LastModified: Date };
	}> = [];
	for (const [empNo, objs] of byEmpNo) {
		if (objs.length > 1) {
			stats.duplicates += objs.length - 1;
			objs.sort((a, b) => b.LastModified.getTime() - a.LastModified.getTime());
			console.log(
				`  Duplicate for ${empNo}: using newest (${objs[0].Key}), skipping ${objs.length - 1} older`
			);
		}
		items.push({ empNo, obj: objs[0] });
	}

	await processBatch(items, async ({ empNo, obj }) => {
		const ext = obj.Key.substring(obj.Key.lastIndexOf('.') + 1);
		const newKey = `human-resource/employees/photos/${empNo}.${ext}`;

		const result = await verifiedCopy(obj.Key, newKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey: obj.Key,
				newKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(employees)
				.set({ photoKey: newKey })
				.where(eq(employees.empNo, empNo));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE employees SET photo_key='${newKey}' WHERE emp_no='${empNo}'`
			);
		}
		if (result.skipped) stats.skipped++;
		else stats.copied++;
	});

	console.log(
		`  Results: ${stats.copied} copied, ${stats.skipped} skipped, ${stats.failed} failed, ${stats.orphaned} orphaned, ${stats.duplicates} duplicates`
	);
}

// ──────────────────────────────────────────
// Phase 3: Admissions Documents
// ──────────────────────────────────────────
async function migrateAdmissionsDocuments() {
	console.log('\n═══ Phase 3: Admissions Documents ═══');
	const stats = log.phases.admissionsDocuments;

	const linkedDocs = await db
		.select({
			docId: documents.id,
			fileName: documents.fileName,
			fileUrl: documents.fileUrl,
			applicantId: applicantDocuments.applicantId,
		})
		.from(documents)
		.innerJoin(
			applicantDocuments,
			eq(applicantDocuments.documentId, documents.id)
		)
		.where(
			and(
				like(documents.fileUrl, '%documents/admissions%'),
				sql`${documents.fileUrl} IS NOT NULL`
			)
		);

	console.log(`Found ${linkedDocs.length} linked admissions documents`);
	stats.total += linkedDocs.length;

	await processBatch(linkedDocs, async (doc) => {
		if (!doc.fileUrl) {
			stats.skipped++;
			return;
		}

		const oldKey = extractKeyFromUrl(doc.fileUrl);
		const fileName = oldKey.split('/').pop() || doc.fileName;
		const newKey = `admissions/applicants/documents/${doc.applicantId}/${fileName}`;

		const result = await verifiedCopy(oldKey, newKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey,
				newKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(documents)
				.set({ fileUrl: newKey })
				.where(eq(documents.id, doc.docId));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE documents SET file_url='${newKey}' WHERE id='${doc.docId}'`
			);
		}
		if (result.skipped) stats.skipped++;
		else stats.copied++;
	});

	console.log('\n  --- Orphaned Admissions Documents ---');
	const orphanedDocs = await db
		.select({
			docId: documents.id,
			fileName: documents.fileName,
			fileUrl: documents.fileUrl,
			type: documents.type,
		})
		.from(documents)
		.leftJoin(
			applicantDocuments,
			eq(applicantDocuments.documentId, documents.id)
		)
		.leftJoin(bankDeposits, eq(bankDeposits.documentId, documents.id))
		.where(
			and(
				isNull(applicantDocuments.id),
				isNull(bankDeposits.id),
				like(documents.fileUrl, 'https://%'),
				sql`${documents.fileUrl} IS NOT NULL`
			)
		);

	console.log(`  Found ${orphanedDocs.length} orphaned documents`);
	stats.total += orphanedDocs.length;

	await processBatch(orphanedDocs, async (doc) => {
		if (!doc.fileUrl) {
			stats.skipped++;
			return;
		}

		stats.orphaned++;
		const oldKey = extractKeyFromUrl(doc.fileUrl);
		const fileName = oldKey.split('/').pop() || doc.fileName;
		const orphanKey = `admissions/applicants/documents/_orphaned/${doc.docId}/${fileName}`;

		const result = await verifiedCopy(oldKey, orphanKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey,
				newKey: orphanKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(documents)
				.set({ fileUrl: orphanKey })
				.where(eq(documents.id, doc.docId));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE orphan documents SET file_url='${orphanKey}' WHERE id='${doc.docId}'`
			);
		}

		log.orphaned.push({
			key: oldKey,
			movedTo: orphanKey,
			reason: `orphaned document (type: ${doc.type || 'unknown'})`,
		});
	});

	console.log(
		`  Results: ${stats.copied} copied, ${stats.skipped} skipped, ${stats.failed} failed, ${stats.orphaned} orphaned`
	);
}

// ──────────────────────────────────────────
// Phase 4: Student Documents (Registry)
// ──────────────────────────────────────────
async function migrateStudentDocuments() {
	console.log('\n═══ Phase 4: Student Documents ═══');
	const stats = log.phases.studentDocuments;

	const docs = await db
		.select({
			docId: documents.id,
			fileName: documents.fileName,
			fileUrl: documents.fileUrl,
			stdNo: studentDocuments.stdNo,
		})
		.from(documents)
		.innerJoin(studentDocuments, eq(studentDocuments.documentId, documents.id))
		.where(sql`${documents.fileUrl} IS NOT NULL`);

	const registryDocs = docs.filter((d) => {
		if (!d.fileUrl) return false;
		return (
			d.fileUrl.includes('documents/registry/students') ||
			(!d.fileUrl.startsWith('http') &&
				!d.fileUrl.startsWith('data:') &&
				!d.fileUrl.includes('documents/admissions'))
		);
	});

	stats.total = registryDocs.length;
	console.log(`Found ${registryDocs.length} student documents`);

	await processBatch(registryDocs, async (doc) => {
		if (!doc.fileUrl) {
			stats.skipped++;
			return;
		}

		let oldKey: string;
		if (doc.fileUrl.startsWith('http')) {
			oldKey = extractKeyFromUrl(doc.fileUrl);
		} else if (doc.fileUrl.includes('/')) {
			oldKey = doc.fileUrl;
		} else {
			oldKey = `documents/registry/students/${doc.stdNo}/${doc.fileUrl}`;
		}

		const fileName = oldKey.split('/').pop() || doc.fileName;
		const newKey = `registry/students/documents/${doc.stdNo}/${fileName}`;

		const result = await verifiedCopy(oldKey, newKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey,
				newKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(documents)
				.set({ fileUrl: newKey })
				.where(eq(documents.id, doc.docId));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE documents SET file_url='${newKey}' WHERE id='${doc.docId}'`
			);
		}
		if (result.skipped) stats.skipped++;
		else stats.copied++;
	});

	console.log(
		`  Results: ${stats.copied} copied, ${stats.skipped} skipped, ${stats.failed} failed`
	);
}

// ──────────────────────────────────────────
// Phase 5: Term Publication Attachments
// ──────────────────────────────────────────
async function migrateTermPublications() {
	console.log('\n═══ Phase 5: Term Publication Attachments ═══');
	const stats = log.phases.termPublications;

	const attachments = await db
		.select({
			id: publicationAttachments.id,
			termCode: publicationAttachments.termCode,
			fileName: publicationAttachments.fileName,
			type: publicationAttachments.type,
		})
		.from(publicationAttachments);

	stats.total = attachments.length;
	console.log(`Found ${attachments.length} publication attachments`);

	function getOldFolder(
		termCode: string,
		type: 'scanned-pdf' | 'raw-marks' | 'other'
	): string {
		switch (type) {
			case 'scanned-pdf':
				return `documents/${termCode}/publications/scanned`;
			case 'raw-marks':
				return `documents/${termCode}/publications/raw-marks`;
			case 'other':
				return `documents/${termCode}/publications/other`;
		}
	}

	await processBatch(attachments, async (att) => {
		const typedType = att.type as 'scanned-pdf' | 'raw-marks' | 'other';
		const oldKey = `${getOldFolder(att.termCode, typedType)}/${att.fileName}`;
		const newKey = `registry/terms/publications/${att.termCode}/${typedType}/${att.fileName}`;

		const result = await verifiedCopy(oldKey, newKey);
		if (!result.ok) {
			stats.failed++;
			log.failures.push({
				oldKey,
				newKey,
				error: result.error,
				timestamp: new Date().toISOString(),
			});
			return;
		}

		if (!DRY_RUN) {
			await db
				.update(publicationAttachments)
				.set({ storageKey: newKey })
				.where(eq(publicationAttachments.id, att.id));
		} else {
			console.log(
				`  [DRY RUN] Would UPDATE publication_attachments SET storage_key='${newKey}' WHERE id='${att.id}'`
			);
		}
		if (result.skipped) stats.skipped++;
		else stats.copied++;
	});

	console.log(
		`  Results: ${stats.copied} copied, ${stats.skipped} skipped, ${stats.failed} failed`
	);
}

// ──────────────────────────────────────────
// Phase 6: Library Resources
// ──────────────────────────────────────────
async function migrateLibraryResources() {
	console.log('\n═══ Phase 6: Library Resources ═══');
	const stats = log.phases.libraryResources;

	if (!BASE_URL) {
		console.log('  NEXT_PUBLIC_R2_PUBLIC_URL not set, skipping URL strip');
		return;
	}

	if (DRY_RUN) {
		const count = await db
			.select({ count: sql<number>`count(*)` })
			.from(documents)
			.where(
				and(
					like(documents.fileUrl, `${BASE_URL}/library/%`),
					sql`${documents.fileUrl} IS NOT NULL`
				)
			);
		stats.total = Number(count[0]?.count || 0);
		console.log(
			`  [DRY RUN] Would strip base URL from ${stats.total} library document URLs`
		);
		stats.copied = stats.total;
		return;
	}

	const result = await db
		.update(documents)
		.set({
			fileUrl: sql`REPLACE(${documents.fileUrl}, ${`${BASE_URL}/`}, '')`,
		})
		.where(
			and(
				like(documents.fileUrl, `${BASE_URL}/library/%`),
				sql`${documents.fileUrl} IS NOT NULL`
			)
		);

	const rowCount = (result as { rowCount?: number }).rowCount || 0;
	stats.total = rowCount;
	stats.copied = rowCount;
	console.log(`  Stripped base URL from ${rowCount} library document URLs`);
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────
async function main() {
	console.log('╔══════════════════════════════════════════╗');
	console.log('║       R2 Storage Migration Script        ║');
	console.log('╚══════════════════════════════════════════╝');
	console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
	console.log(`Phase: ${phaseArg}`);
	console.log(`Bucket: ${BUCKET_NAME}`);
	console.log(`Base URL: ${BASE_URL}`);
	console.log('');

	const shouldRun = (phase: string) => phaseArg === 'all' || phaseArg === phase;

	if (shouldRun('photos') || shouldRun('student-photos')) {
		await migrateStudentPhotos();
	}
	if (shouldRun('photos') || shouldRun('employee-photos')) {
		await migrateEmployeePhotos();
	}
	if (shouldRun('documents') || shouldRun('admissions')) {
		await migrateAdmissionsDocuments();
	}
	if (shouldRun('documents') || shouldRun('student-documents')) {
		await migrateStudentDocuments();
	}
	if (shouldRun('publications') || shouldRun('term-publications')) {
		await migrateTermPublications();
	}
	if (shouldRun('library')) {
		await migrateLibraryResources();
	}

	log.completedAt = new Date().toISOString();

	console.log('\n╔══════════════════════════════════════════╗');
	console.log('║              Summary Report              ║');
	console.log('╚══════════════════════════════════════════╝');
	for (const [phase, stats] of Object.entries(log.phases)) {
		if (stats.total > 0) {
			console.log(`\n  ${phase}:`);
			console.log(`    Total: ${stats.total}`);
			console.log(`    Copied: ${stats.copied}`);
			console.log(`    Skipped: ${stats.skipped}`);
			console.log(`    Failed: ${stats.failed}`);
			console.log(`    Orphaned: ${stats.orphaned}`);
			console.log(`    Duplicates: ${stats.duplicates}`);
		}
	}

	if (log.failures.length > 0) {
		console.log(`\n  ⚠ ${log.failures.length} total failures — see log file`);
	}

	const fs = await import('node:fs');
	const path = await import('node:path');
	const logDir = path.resolve(process.cwd(), 'scripts/migration-logs');
	fs.mkdirSync(logDir, { recursive: true });
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const logPath = path.join(logDir, `r2-migration-${timestamp}.json`);
	fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
	console.log(`\nLog written to: ${logPath}`);
}

main()
	.then(() => {
		console.log('\nDone.');
		process.exit(0);
	})
	.catch((err) => {
		console.error('Migration failed:', err);
		process.exit(1);
	});
