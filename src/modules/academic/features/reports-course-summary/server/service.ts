import { Packer } from 'docx';
import { auth } from '@/core/auth';
import { getAssessmentTypeLabel } from '@/modules/academic/features/assessments/components/[id]/assessments';
import { termsRepository } from '@/modules/registry/features/terms/server/repository';
import { createCourseSummaryDocument } from './document';
import {
	type CourseSummaryReport,
	courseSummaryRepository,
	type StudentModuleReport,
} from './repository';

type CourseSummaryData = {
	assessments: Array<{
		stdNo: number;
		assessmentType: string;
		marks: number;
		totalMarks: number;
	}>;
	students: Array<{
		stdNo: number;
		name: string;
		status: string;
		grade: string;
		weightedTotal: number;
		marks: string;
	}>;
	courseCode: string;
	courseName: string;
	programName: string;
	programCode: string;
	termName: string;
};

export default class CourseSummaryService {
	private repository = courseSummaryRepository;
	async generateCourseSummaryReport(
		programId: number | undefined,
		semesterModuleId: number
	): Promise<Buffer> {
		const currentTerm = await termsRepository.getActive();
		if (!currentTerm) {
			throw new Error('No active term found');
		}

		const reportData = await this.repository.getOptimizedCourseSummaryData(
			semesterModuleId,
			currentTerm.name,
			programId
		);

		if (!reportData) {
			throw new Error('Course data not found');
		}

		const finalReportData =
			await this.processOptimizedCourseSummaryData(reportData);

		const document = createCourseSummaryDocument(finalReportData);
		const buffer = await Packer.toBuffer(document);
		return Buffer.from(buffer);
	}
	private async processOptimizedCourseSummaryData(
		data: CourseSummaryData
	): Promise<CourseSummaryReport> {
		const user = await auth();
		const failedStudents: StudentModuleReport[] = [];
		const supplementaryStudents: StudentModuleReport[] = [];
		let totalPasses = 0;

		const assessmentsMap = new Map<
			number,
			Array<{
				assessmentType: string;
				studentMarks: number;
				totalMarks: number;
			}>
		>();

		data.assessments.forEach((assessment) => {
			if (!assessmentsMap.has(assessment.stdNo)) {
				assessmentsMap.set(assessment.stdNo, []);
			}
			assessmentsMap.get(assessment.stdNo)!.push({
				assessmentType: assessment.assessmentType,
				studentMarks: assessment.marks,
				totalMarks: assessment.totalMarks,
			});
		});

		for (const student of data.students) {
			const marks = student.weightedTotal || parseFloat(student.marks);
			const grade = student.grade;
			const isNumericMark = !Number.isNaN(marks);

			let reason = '';
			let actionTaken = '';

			if (this.isFailingGrade(grade) || (isNumericMark && marks < 50)) {
				reason = this.generateFailureReasonFromData(
					assessmentsMap.get(student.stdNo) || [],
					grade,
					marks
				);
				actionTaken = 'STUDENT TO REPEAT THE MODULE';

				failedStudents.push({
					studentId: student.stdNo,
					studentName: student.name,
					studentNumber: student.stdNo.toString(),
					marks: marks.toString(),
					grade: grade,
					status: student.status,
					reason,
					actionTaken,
				});
			} else if (
				this.isSupplementaryGrade(grade) ||
				(isNumericMark && marks >= 40 && marks < 50)
			) {
				reason = this.generateFailureReasonFromData(
					assessmentsMap.get(student.stdNo) || [],
					grade,
					marks
				);
				actionTaken = 'STUDENT TO SUPPLEMENT THE EXAM';

				supplementaryStudents.push({
					studentId: student.stdNo,
					studentName: student.name,
					studentNumber: student.stdNo.toString(),
					marks: marks.toString(),
					grade: grade,
					status: student.status,
					reason,
					actionTaken,
				});
			} else {
				totalPasses++;
			}
		}

		return {
			courseCode: data.courseCode,
			courseName: data.courseName,
			programName: data.programName,
			programCode: data.programCode,
			lecturer: user?.user?.name || '',
			date: new Date().toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			}),
			termName: data.termName,
			totalStudents: data.students.length,
			totalPasses,
			totalFailures: failedStudents.length,
			totalSupplementary: supplementaryStudents.length,
			failedStudents: failedStudents.sort((a, b) =>
				a.studentName.localeCompare(b.studentName)
			),
			supplementaryStudents: supplementaryStudents.sort((a, b) =>
				a.studentName.localeCompare(b.studentName)
			),
		};
	}

	private generateFailureReasonFromData(
		assessments: Array<{
			assessmentType: string;
			studentMarks: number;
			totalMarks: number;
		}>,
		grade: string,
		marks: number
	): string {
		const failedAssessments: string[] = [];

		for (const assessment of assessments) {
			const passingGrade = assessment.totalMarks * 0.5;
			if (assessment.studentMarks < passingGrade) {
				failedAssessments.push(
					`Failed ${getAssessmentTypeLabel(assessment.assessmentType)} (${assessment.studentMarks}/${assessment.totalMarks})`
				);
			}
		}

		if (failedAssessments.length > 0) {
			return `- ${failedAssessments.join('\n- ')}`;
		}

		return `Failed ${grade === 'F' ? 'Final Exam' : 'Module'} (${marks}/100)`;
	}
	private isFailingGrade(grade: string): boolean {
		return ['F', 'FX', 'X', 'FIN', 'ANN', 'DNC', 'DNA'].includes(grade);
	}

	private isSupplementaryGrade(grade: string): boolean {
		return ['Supplementary', 'PP'].includes(grade);
	}

	async getAvailableModulesForProgram(programId: number) {
		return this.repository.getAvailableModulesForProgram(programId);
	}
}

export const courseSummaryService = new CourseSummaryService();
