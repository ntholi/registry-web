import { studentsService } from '@/app/registry/students/_server/service';
import { getUnpublishedTermCodes } from '@/app/registry/terms/settings/_server/actions';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import BulkRepository from './repository';

class BulkService {
	private repository: BulkRepository;

	constructor() {
		this.repository = new BulkRepository();
	}

	async getDistinctGraduationDates() {
		return withPermission(
			async () => {
				return await this.repository.findDistinctGraduationDates();
			},
			async (session) =>
				session?.user?.role === 'admin' || session?.user?.role === 'registry'
		);
	}

	async getProgramsByGraduationDate(graduationDate: string) {
		return withPermission(
			async () => {
				return await this.repository.findProgramsByGraduationDate(
					graduationDate
				);
			},
			async (session) =>
				session?.user?.role === 'admin' || session?.user?.role === 'registry'
		);
	}

	async getStudentsByGraduationDate(
		graduationDate: string,
		programIds?: number[]
	) {
		return withPermission(
			async () => {
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
			},
			async (session) =>
				session?.user?.role === 'admin' || session?.user?.role === 'registry'
		);
	}
}

export const bulkService = serviceWrapper(BulkService, 'BulkService');
