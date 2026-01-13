import { studentsService } from '@/app/registry/students/_server/service';
import { getUnpublishedTermCodes } from '@/app/registry/terms/settings/_server/actions';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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

			const unpublishedTerms = await getUnpublishedTermCodes();

			const students = await Promise.all(
				stdNos.map(async (stdNo) => {
					try {
						return await studentsService.getAcademicHistory(
							stdNo,
							unpublishedTerms
						);
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
