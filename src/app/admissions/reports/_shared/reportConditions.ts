import { applicationScores } from '@admissions/applications/_schema/applicationScores';
import { eq, inArray, type SQL, sql } from 'drizzle-orm';
import { applications, programs } from '@/core/database';
import type { AdmissionReportFilter } from './types';

export function buildAdmissionReportConditions(
	filter: AdmissionReportFilter
): SQL[] {
	const conditions: SQL[] = [];

	if (filter.intakePeriodId) {
		conditions.push(eq(applications.intakePeriodId, filter.intakePeriodId));
	}

	if (filter.schoolIds?.length) {
		conditions.push(inArray(programs.schoolId, filter.schoolIds));
	}

	if (filter.programId) {
		conditions.push(eq(programs.id, filter.programId));
	}

	if (filter.programLevels?.length) {
		conditions.push(inArray(programs.level, filter.programLevels));
	}

	if (filter.applicationStatuses?.length) {
		conditions.push(inArray(applications.status, filter.applicationStatuses));
	}

	if (filter.scoreRange) {
		const [minScore, maxScore] = filter.scoreRange;
		conditions.push(
			sql`exists (
				select 1
				from ${applicationScores}
				where ${applicationScores.applicationId} = ${applications.id}
					and ${applicationScores.overallScore} is not null
					and ${applicationScores.overallScore} >= ${minScore}
					and ${applicationScores.overallScore} <= ${maxScore}
			)`
		);
	}

	return conditions;
}
