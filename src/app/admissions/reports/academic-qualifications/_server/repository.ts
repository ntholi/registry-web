import { and, count, desc, eq, isNotNull } from 'drizzle-orm';
import {
	academicRecords,
	applications,
	certificateTypes,
	db,
	programs,
	schools,
	subjectGrades,
} from '@/core/database';
import { buildAdmissionReportConditions } from '../../_shared/reportConditions';
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

export interface OriginSchoolRow {
	name: string;
	count: number;
}

export class AcademicQualificationsRepository {
	async getCertificateTypeDistribution(
		filter: AdmissionReportFilter
	): Promise<CertificateDistRow[]> {
		const conditions = buildAdmissionReportConditions(filter);

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
			.orderBy(desc(count()), certificateTypes.name);

		return rows;
	}

	async getGradeDistribution(
		filter: AdmissionReportFilter
	): Promise<GradeDistRow[]> {
		const conditions = buildAdmissionReportConditions(filter);

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

		return rows
			.filter((r) => r.grade !== null)
			.map((r) => ({ grade: r.grade!, count: r.count }))
			.sort((a, b) => b.count - a.count);
	}

	async getResultClassification(
		filter: AdmissionReportFilter
	): Promise<ClassificationDistRow[]> {
		const conditions = buildAdmissionReportConditions(filter);

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

		return rows
			.filter((r) => r.classification !== null)
			.map((r) => ({ classification: r.classification!, count: r.count }))
			.sort((a, b) => b.count - a.count);
	}

	async getTopOriginSchools(
		filter: AdmissionReportFilter
	): Promise<OriginSchoolRow[]> {
		const conditions = buildAdmissionReportConditions(filter);

		const rows = await db
			.select({
				name: academicRecords.institutionName,
				count: count(),
			})
			.from(academicRecords)
			.innerJoin(
				applications,
				eq(academicRecords.applicantId, applications.applicantId)
			)
			.innerJoin(programs, eq(applications.firstChoiceProgramId, programs.id))
			.innerJoin(schools, eq(programs.schoolId, schools.id))
			.where(conditions.length ? and(...conditions) : undefined)
			.groupBy(academicRecords.institutionName)
			.orderBy(desc(count()))
			.limit(100);

		return rows;
	}
}
