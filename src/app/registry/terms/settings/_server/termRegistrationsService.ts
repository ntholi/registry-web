import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import TermRegistrationsRepository from './termRegistrationsRepository';

interface RegistrationEntry {
	schoolId: number;
	startDate: string;
	endDate: string;
	programIds?: number[];
}

class TermRegistrationsService {
	private repository = new TermRegistrationsRepository();

	async findByTermId(termId: number) {
		return withPermission(
			async () => this.repository.findByTermId(termId),
			'all'
		);
	}

	async create(
		termId: number,
		schoolId: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) {
					throw new Error('Unauthorized');
				}
				return this.repository.create(
					{
						termId,
						schoolId,
						startDate,
						endDate,
						createdBy: userId,
					},
					programIds
				);
			},
			{ 'terms-settings': ['update'] }
		);
	}

	async update(
		id: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) {
		return withPermission(
			async () =>
				this.repository.update(id, { startDate, endDate }, programIds),
			{ 'terms-settings': ['update'] }
		);
	}

	async delete(id: number) {
		return withPermission(async () => this.repository.delete(id), {
			'terms-settings': ['update'],
		});
	}

	async saveRegistrations(termId: number, entries: RegistrationEntry[]) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (!userId) {
					throw new Error('Unauthorized');
				}
				return this.repository.bulkUpsert(termId, entries, userId);
			},
			{ 'terms-settings': ['update'] }
		);
	}

	async deleteBySchoolIds(termId: number, schoolIds: number[]) {
		return withPermission(
			async () => this.repository.deleteByTermIdAndSchoolIds(termId, schoolIds),
			{ 'terms-settings': ['update'] }
		);
	}

	async canStudentRegister(
		termId: number,
		schoolId: number,
		programId: number
	) {
		return withPermission(
			async () =>
				this.repository.canStudentRegister(termId, schoolId, programId),
			'all'
		);
	}

	async getRegistrationStatus(termId: number, schoolId: number) {
		return withPermission(
			async () => this.repository.getRegistrationStatus(termId, schoolId),
			'all'
		);
	}
}

export const termRegistrationsService = serviceWrapper(
	TermRegistrationsService,
	'TermRegistrationsService'
);
