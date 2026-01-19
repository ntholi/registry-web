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

	const standardGrade = lookup.get(normalizeGrade(originalGrade));
	if (!standardGrade) {
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

	return grades.map((grade) => {
		const standardGrade = mappingLookup.get(
			normalizeGrade(grade.originalGrade)
		);
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
