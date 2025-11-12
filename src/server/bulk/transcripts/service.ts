import BulkRepository from '@server/admin/bulk/transcripts/repository';
import { serviceWrapper } from '@server/base/serviceWrapper';
import { studentsService } from '@server/registry/students/service';
import withAuth from '@/server/base/withAuth';

class BulkService {
	private repository: BulkRepository;

	constructor() {
		this.repository = new BulkRepository();
	}

	async getDistinctGraduationDates() {
		return withAuth(async () => {
			return await this.repository.findDistinctGraduationDates();
		}, ['admin', 'registry']);
	}

	async getProgramsByGraduationDate(graduationDate: string) {
		return withAuth(async () => {
			return await this.repository.findProgramsByGraduationDate(graduationDate);
		}, ['admin', 'registry']);
	}

	async getStudentsByGraduationDate(
		graduationDate: string,
		programIds?: number[]
	) {
		return withAuth(async () => {
			const stdNos = await this.repository.findStudentsByGraduationDate(
				graduationDate,
				programIds
			);

			const students = await Promise.all(
				stdNos.map(async (stdNo) => {
					try {
						return await studentsService.getAcademicHistory(stdNo, true);
					} catch {
						return null;
					}
				})
			);

			return students.filter(
				(student): student is NonNullable<typeof student> => student !== null
			);
		}, ['admin', 'registry']);
	}
}

export const bulkService = serviceWrapper(BulkService, 'BulkService');
