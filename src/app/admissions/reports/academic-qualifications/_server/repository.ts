import { and, count, eq, inArray, isNotNull, type SQL } from 'drizzle-orm';
import {
	academicRecords,
	applications,
	certificateTypes,
	db,
	programs,
	schools,
	subjectGrades,
} from '@/core/database';
import type { AdmissionReportFilter } from '../../_shared/types';

export interface CertificateDistRow {
	certificateTypeId: string;
	certificateTypeName: string;
	count: number;
}

export interface GradeDistRow {
	grade: string;
	count: number;
}

export interface ClassificationDistRow {
	classification: string;
	count: number;
}

function buildConditions(filter: AdmissionReportFilter): SQL[] {
	const conditions: SQL[] = [];
	if (filter.intakePeriodId) {
		conditions.push(eq(applications.intakePeriodId, filter.intakePeriodId));
	}
	if (filter.schoolIds?.length) {
		conditions.push(inArray(programs.schoolId, filter.schoolIds));
	}
	if (filter.programId) {
		conditions.push(eq(applications.firstChoiceProgramId, filter.programId));
	}
	if (filter.programLevels?.length) {
		conditions.push(inArray(programs.level, filter.programLevels));
	}
	if (filter.applicationStatuses?.length) {
		conditions.push(inArray(applications.status, filter.applicationStatuses));
	}
	return conditions;
}

export class AcademicQualificationsRepository {
	async getCertificateTypeDistribution(
		filter: AdmissionReportFilter
	): Promise<CertificateDistRow[]> {
		const conditions = buildConditions(filter);

		const rows = await db
			.select({
				certificateTypeId: certificateTypes.id,
				certificateTypeName: certificateTypes.name,
				count: count(),
			})
			.from(academicRecords)
			.innerJoin(
				applications,
				eq(academicRecords.applicantId, applications.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.innerJoin(
				certificateTypes,
				eq(academicRecords.certificateTypeId, certificateTypes.id)
			)
			.where(conditions.length ? and(...conditions) : undefined)
			.groupBy(certificateTypes.id, certificateTypes.name)
			.orderBy(certificateTypes.name);

		return rows;
	}

	async getGradeDistribution(
		filter: AdmissionReportFilter
	): Promise<GradeDistRow[]> {
		const conditions = buildConditions(filter);

		const rows = await db
			.select({
				grade: subjectGrades.standardGrade,
				count: count(),
			})
			.from(subjectGrades)
			.innerJoin(
				academicRecords,
				eq(subjectGrades.academicRecordId, academicRecords.id)
			)
			.innerJoin(
				applications,
				eq(academicRecords.applicantId, applications.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(
				and(
					isNotNull(subjectGrades.standardGrade),
					...(conditions.length ? conditions : [])
				)
			)
			.groupBy(subjectGrades.standardGrade);

		const gradeOrder = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
		return rows
			.filter((r) => r.grade !== null)
			.map((r) => ({ grade: r.grade!, count: r.count }))
			.sort(
				(a, b) => gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade)
			);
	}

	async getResultClassification(
		filter: AdmissionReportFilter
	): Promise<ClassificationDistRow[]> {
		const conditions = buildConditions(filter);

		const rows = await db
			.select({
				classification: academicRecords.resultClassification,
				count: count(),
			})
			.from(academicRecords)
			.innerJoin(
				applications,
				eq(academicRecords.applicantId, applications.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(
				and(
					isNotNull(academicRecords.resultClassification),
					...(conditions.length ? conditions : [])
				)
			)
			.groupBy(academicRecords.resultClassification);

		const classOrder = ['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'];
		return rows
			.filter((r) => r.classification !== null)
			.map((r) => ({ classification: r.classification!, count: r.count }))
			.sort(
				(a, b) =>
					classOrder.indexOf(a.classification) -
					classOrder.indexOf(b.classification)
			);
	}
}
