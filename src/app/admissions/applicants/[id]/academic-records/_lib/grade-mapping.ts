import type { StandardGrade } from '@admissions/_database';
import { eq } from 'drizzle-orm';
import { db, gradeMappings } from '@/core/database';

export type MappedGrade = {
	originalGrade: string;
	standardGrade: StandardGrade;
};

function normalizeGrade(value: string): string {
	return value.trim().toLowerCase();
}

export async function mapGradeToStandard(
	originalGrade: string,
	certificateTypeId: string
): Promise<StandardGrade> {
	const mappings = await db.query.gradeMappings.findMany({
		where: eq(gradeMappings.certificateTypeId, certificateTypeId),
	});

	const lookup = new Map(
		mappings.map((m) => [normalizeGrade(m.originalGrade), m.standardGrade])
	);

	const normalized = normalizeGrade(originalGrade);
	const standardGrade = lookup.get(normalized);

	if (!standardGrade) {
		const upperGrade = originalGrade.trim().toUpperCase() as StandardGrade;
		const validGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
		if (validGrades.includes(upperGrade)) {
			return upperGrade;
		}

		throw new Error(
			`INVALID_GRADE_MAPPING: Grade "${originalGrade}" not found in certificate type mappings`
		);
	}

	return standardGrade;
}

export async function mapGradesToStandard(
	grades: { subjectId: string; originalGrade: string }[],
	certificateTypeId: string
): Promise<
	{ subjectId: string; originalGrade: string; standardGrade: StandardGrade }[]
> {
	const mappings = await db.query.gradeMappings.findMany({
		where: eq(gradeMappings.certificateTypeId, certificateTypeId),
	});

	const mappingLookup = new Map(
		mappings.map((m) => [normalizeGrade(m.originalGrade), m.standardGrade])
	);

	const validGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];

	return grades.map((grade) => {
		const normalized = normalizeGrade(grade.originalGrade);
		let standardGrade = mappingLookup.get(normalized);

		if (!standardGrade) {
			const upperGrade = grade.originalGrade
				.trim()
				.toUpperCase() as StandardGrade;
			if (validGrades.includes(upperGrade)) {
				standardGrade = upperGrade;
			}
		}

		if (!standardGrade) {
			throw new Error(
				`INVALID_GRADE_MAPPING: Grade "${grade.originalGrade}" not found in certificate type mappings`
			);
		}
		return {
			subjectId: grade.subjectId,
			originalGrade: grade.originalGrade,
			standardGrade,
		};
	});
}
