import '../src/core/database/env-load';
import fs from 'node:fs';
import path from 'node:path';
import { isNotNull, sql } from 'drizzle-orm';
import {
	db,
	documents,
	employees,
	publicationAttachments,
	students,
} from '@/core/database';

function escapeSql(value: string): string {
	return value.replace(/'/g, "''");
}

async function main() {
	console.log('╔══════════════════════════════════════════╗');
	console.log('║    Generate Remote DB Sync SQL File      ║');
	console.log('╚══════════════════════════════════════════╝');
	console.log(`Database: ${process.env.DATABASE_ENV || 'local'}`);
	console.log('');

	const lines: string[] = [];
	lines.push('-- Remote DB Sync: Generated from local DB');
	lines.push(`-- Generated at: ${new Date().toISOString()}`);
	lines.push(
		'-- Apply with: psql $DATABASE_REMOTE_URL -f scripts/remote-sync.sql'
	);
	lines.push('');
	lines.push('BEGIN;');
	lines.push('');

	// 1. Students photo_key
	console.log('Exporting students.photo_key...');
	const studentPhotos = await db
		.select({ stdNo: students.stdNo, photoKey: students.photoKey })
		.from(students)
		.where(isNotNull(students.photoKey));

	lines.push(`-- Students photo_key: ${studentPhotos.length} rows`);
	for (const row of studentPhotos) {
		lines.push(
			`UPDATE students SET photo_key = '${escapeSql(row.photoKey!)}' WHERE std_no = ${row.stdNo};`
		);
	}
	lines.push('');
	console.log(`  ${studentPhotos.length} students with photo_key`);

	// 2. Employees photo_key
	console.log('Exporting employees.photo_key...');
	const employeePhotos = await db
		.select({ empNo: employees.empNo, photoKey: employees.photoKey })
		.from(employees)
		.where(isNotNull(employees.photoKey));

	lines.push(`-- Employees photo_key: ${employeePhotos.length} rows`);
	for (const row of employeePhotos) {
		lines.push(
			`UPDATE employees SET photo_key = '${escapeSql(row.photoKey!)}' WHERE emp_no = '${escapeSql(row.empNo)}';`
		);
	}
	lines.push('');
	console.log(`  ${employeePhotos.length} employees with photo_key`);

	// 3. Documents file_url (only rows that were migrated)
	// Migrated rows have file_url that does NOT start with 'https://' or 'data:'
	// because Steps 3+4 converted them to R2 keys
	console.log('Exporting documents.file_url...');
	const migratedDocs = await db
		.select({ id: documents.id, fileUrl: documents.fileUrl })
		.from(documents)
		.where(
			sql`${documents.fileUrl} IS NOT NULL
			AND ${documents.fileUrl} NOT LIKE 'https://%'
			AND ${documents.fileUrl} NOT LIKE 'data:%'`
		);

	lines.push(`-- Documents file_url: ${migratedDocs.length} rows`);
	for (const row of migratedDocs) {
		lines.push(
			`UPDATE documents SET file_url = '${escapeSql(row.fileUrl!)}' WHERE id = '${escapeSql(row.id)}';`
		);
	}
	lines.push('');
	console.log(`  ${migratedDocs.length} documents with migrated file_url`);

	// 4. Publication attachments storage_key
	console.log('Exporting publication_attachments.storage_key...');
	const pubAttachments = await db
		.select({
			id: publicationAttachments.id,
			storageKey: publicationAttachments.storageKey,
		})
		.from(publicationAttachments)
		.where(isNotNull(publicationAttachments.storageKey));

	lines.push(
		`-- Publication attachments storage_key: ${pubAttachments.length} rows`
	);
	for (const row of pubAttachments) {
		lines.push(
			`UPDATE publication_attachments SET storage_key = '${escapeSql(row.storageKey!)}' WHERE id = '${escapeSql(row.id)}';`
		);
	}
	lines.push('');
	console.log(
		`  ${pubAttachments.length} publication_attachments with storage_key`
	);

	lines.push('COMMIT;');
	lines.push('');

	// Summary
	const totalUpdates =
		studentPhotos.length +
		employeePhotos.length +
		migratedDocs.length +
		pubAttachments.length;

	lines.push(`-- Summary: ${totalUpdates} total UPDATE statements`);
	lines.push(`--   students.photo_key: ${studentPhotos.length}`);
	lines.push(`--   employees.photo_key: ${employeePhotos.length}`);
	lines.push(`--   documents.file_url: ${migratedDocs.length}`);
	lines.push(
		`--   publication_attachments.storage_key: ${pubAttachments.length}`
	);

	const outputPath = path.resolve(process.cwd(), 'scripts/remote-sync.sql');
	fs.writeFileSync(outputPath, lines.join('\n'));

	console.log('');
	console.log(`SQL file written to: ${outputPath}`);
	console.log(`Total UPDATE statements: ${totalUpdates}`);
	console.log('');
	console.log('Next steps:');
	console.log('  1. Review the generated SQL file');
	console.log(
		'  2. Apply schema migration: DATABASE_ENV=remote pnpm db:migrate'
	);
	console.log(
		'  3. Apply sync: psql $DATABASE_REMOTE_URL -f scripts/remote-sync.sql'
	);
	console.log('  4. Verify with queries from Step 10 verification section');
}

main()
	.then(() => {
		console.log('\nDone.');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Generation failed:', error);
		process.exit(1);
	});
