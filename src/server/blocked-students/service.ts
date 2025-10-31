import type { blockedStudents, DashboardUser } from '@/db/schema';
import withAuth from '@/server/base/withAuth';
import type { QueryOptions } from '../base/BaseRepository';
import { serviceWrapper } from '../base/serviceWrapper';
import BlockedStudentRepository from './repository';

type BlockedStudent = typeof blockedStudents.$inferInsert;

class BlockedStudentService {
	constructor(private readonly repository = new BlockedStudentRepository()) {}

	async first() {
		return withAuth(async () => this.repository.findFirst(), []);
	}

	async get(id: number) {
		return withAuth(async () => this.repository.findById(id), ['finance']);
	}

	async getByStdNo(stdNo: number, status: 'blocked' | 'unblocked' = 'blocked') {
		return withAuth(async () => this.repository.findByStdNo(stdNo, status), ['all']);
	}

	async getAll(params: QueryOptions<typeof blockedStudents>) {
		return withAuth(async () => this.repository.query(params), ['finance']);
	}

	async create(data: BlockedStudent) {
		return withAuth(
			async (session) => {
				return this.repository.create({
					...data,
					byDepartment: session?.user?.role as DashboardUser,
					status: 'blocked',
				});
			},
			['finance', 'registry', 'library']
		);
	}

	async update(id: number, data: Partial<BlockedStudent>) {
		return withAuth(
			async (session) => {
				return this.repository.update(id, {
					byDepartment: session?.user?.role as DashboardUser,
					...data,
				});
			},
			['finance', 'registry', 'library']
		);
	}

	async delete(id: number) {
		return withAuth(async () => this.repository.delete(id), []);
	}

	async count() {
		return withAuth(async () => this.repository.count(), []);
	}
}

export const blockedStudentsService = serviceWrapper(BlockedStudentService, 'BlockedStudent');
