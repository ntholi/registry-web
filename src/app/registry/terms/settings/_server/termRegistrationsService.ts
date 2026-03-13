import { hasPermission } from '@/core/auth/sessionPermissions';
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
			['all']
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
				if (
					session?.user?.role !== 'admin' &&
					!hasPermission(session, 'terms-settings', 'update')
				) {
					throw new Error('Unauthorized');
				}
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
			['admin', 'registry']
		);
	}

	async update(
		id: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) {
		return withPermission(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!hasPermission(session, 'terms-settings', 'update')
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.update(id, { startDate, endDate }, programIds);
			},
			['admin', 'registry']
		);
	}

	async delete(id: number) {
		return withPermission(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!hasPermission(session, 'terms-settings', 'update')
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.delete(id);
			},
			['admin', 'registry']
		);
	}

	async saveRegistrations(termId: number, entries: RegistrationEntry[]) {
		return withPermission(
			async (session) => {
				const userId = session?.user?.id;
				if (
					session?.user?.role !== 'admin' &&
					!hasPermission(session, 'terms-settings', 'update')
				) {
					throw new Error('Unauthorized');
				}
				if (!userId) {
					throw new Error('Unauthorized');
				}
				return this.repository.bulkUpsert(termId, entries, userId);
			},
			['admin', 'registry']
		);
	}

	async deleteBySchoolIds(termId: number, schoolIds: number[]) {
		return withPermission(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!hasPermission(session, 'terms-settings', 'update')
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.deleteByTermIdAndSchoolIds(termId, schoolIds);
			},
			['admin', 'registry']
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
			['all']
		);
	}

	async getRegistrationStatus(termId: number, schoolId: number) {
		return withPermission(
			async () => this.repository.getRegistrationStatus(termId, schoolId),
			['all']
		);
	}
}

export const termRegistrationsService = serviceWrapper(
	TermRegistrationsService,
	'TermRegistrationsService'
);
