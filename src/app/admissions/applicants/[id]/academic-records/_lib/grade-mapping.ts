import type { StandardGrade } from '@admissions/_database';
import { eq } from 'drizzle-orm';
import { db, gradeMappings } from '@/core/database';

export type MappedGrade = {
	originalGrade: string;
	standardGrade: StandardGrade;
};

export async function mapGradeToStandard(
	originalGrade: string,
	certificateTypeId: string
): Promise<StandardGrade> {
	const mapping = await db.query.gradeMappings.findFirst({
		where: (gm, { and }) =>
			and(
				eq(gm.certificateTypeId, certificateTypeId),
				eq(gm.originalGrade, originalGrade)
			),
	});

	if (!mapping) {
		throw new Error(
			`INVALID_GRADE_MAPPING: Grade "${originalGrade}" not found in certificate type mappings`
		);
	}

	return mapping.standardGrade;
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
		mappings.map((m) => [m.originalGrade.toLowerCase(), m.standardGrade])
	);

	return grades.map((grade) => {
		const standardGrade = mappingLookup.get(grade.originalGrade.toLowerCase());
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
