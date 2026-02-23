import '../src/core/database/env-load';
import { calculateAllScores } from '@admissions/applications/_lib/scoring';
import type {
	ClassificationRules,
	SubjectGradeRules,
} from '@admissions/entry-requirements/_lib/types';
import { eq, isNull } from 'drizzle-orm';
import { applicationScores, applications, db } from '@/core/database';

const BATCH_SIZE = 50;

async function backfillScores() {
	console.log('Loading entry requirements and recognized schools...');
	const [requirements, schools] = await Promise.all([
		db.query.entryRequirements.findMany({
			with: {
				certificateType: {
					columns: { id: true, name: true, lqfLevel: true },
				},
			},
		}),
		db.query.recognizedSchools.findMany({
			columns: { name: true },
		}),
	]);

	const typedRequirements = requirements.map((er) => ({
		programId: er.programId,
		certificateType: er.certificateType,
		rules: er.rules as SubjectGradeRules | ClassificationRules,
	}));

	console.log(
		`Loaded ${requirements.length} entry requirements, ${schools.length} recognized schools`
	);

	const allApps = await db
		.select({
			id: applications.id,
			applicantId: applications.applicantId,
			firstChoiceProgramId: applications.firstChoiceProgramId,
			secondChoiceProgramId: applications.secondChoiceProgramId,
		})
		.from(applications)
		.leftJoin(
			applicationScores,
			eq(applications.id, applicationScores.applicationId)
		)
		.where(isNull(applicationScores.id));

	console.log(`Found ${allApps.length} applications without scores`);

	if (allApps.length === 0) {
		console.log('Nothing to do.');
		process.exit(0);
	}

	let processed = 0;
	let scored = 0;
	let skipped = 0;

	for (let i = 0; i < allApps.length; i += BATCH_SIZE) {
		const batch = allApps.slice(i, i + BATCH_SIZE);

		const applicantIds = [...new Set(batch.map((a) => a.applicantId))];

		const records = await db.query.academicRecords.findMany({
			where: (ar, { inArray }) => inArray(ar.applicantId, applicantIds),
			with: {
				certificateType: {
					columns: { id: true, name: true, lqfLevel: true },
				},
				subjectGrades: {
					with: { subject: { columns: { id: true, name: true } } },
				},
			},
		});

		const recordsByApplicant = new Map<string, typeof records>();
		for (const record of records) {
			const existing = recordsByApplicant.get(record.applicantId) ?? [];
			existing.push(record);
			recordsByApplicant.set(record.applicantId, existing);
		}

		for (const app of batch) {
			const appRecords = recordsByApplicant.get(app.applicantId) ?? [];

			if (appRecords.length === 0) {
				skipped++;
				processed++;
				continue;
			}

			const scores = calculateAllScores(
				appRecords,
				app.firstChoiceProgramId,
				app.secondChoiceProgramId,
				typedRequirements,
				schools
			);

			await db
				.insert(applicationScores)
				.values({
					applicationId: app.id,
					...scores,
					calculatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: applicationScores.applicationId,
					set: {
						...scores,
						calculatedAt: new Date(),
					},
				});

			scored++;
			processed++;
		}

		console.log(
			`Processed ${processed}/${allApps.length} (scored: ${scored}, skipped: ${skipped})`
		);
	}

	console.log(
		`\nDone! Scored: ${scored}, Skipped (no records): ${skipped}, Total: ${processed}`
	);
	process.exit(0);
}

backfillScores().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
