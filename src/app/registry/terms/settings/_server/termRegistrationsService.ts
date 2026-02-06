import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
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
		return withAuth(async () => this.repository.findByTermId(termId), ['all']);
	}

	async create(
		termId: number,
		schoolId: number,
		startDate: string,
		endDate: string,
		programIds?: number[]
	) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.create(
					{
						termId,
						schoolId,
						startDate,
						endDate,
						createdBy: session.user.id,
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
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.update(id, { startDate, endDate }, programIds);
			},
			['admin', 'registry']
		);
	}

	async delete(id: number) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.delete(id);
			},
			['admin', 'registry']
		);
	}

	async saveRegistrations(termId: number, entries: RegistrationEntry[]) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
				) {
					throw new Error('Unauthorized');
				}
				return this.repository.bulkUpsert(termId, entries, session.user.id);
			},
			['admin', 'registry']
		);
	}

	async deleteBySchoolIds(termId: number, schoolIds: number[]) {
		return withAuth(
			async (session) => {
				if (
					session?.user?.role !== 'admin' &&
					!(
						session?.user?.role === 'registry' &&
						session?.user?.position === 'manager'
					)
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
		return withAuth(
			async () =>
				this.repository.canStudentRegister(termId, schoolId, programId),
			['all']
		);
	}

	async getRegistrationStatus(termId: number, schoolId: number) {
		return withAuth(
			async () => this.repository.getRegistrationStatus(termId, schoolId),
			['all']
		);
	}
}

export const termRegistrationsService = serviceWrapper(
	TermRegistrationsService,
	'TermRegistrationsService'
);
