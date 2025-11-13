import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { studentsService } from '@/modules/registry/features/students/server/service';
import BulkRepository from './repository';

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
