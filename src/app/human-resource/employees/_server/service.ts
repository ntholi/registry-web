import type { employees } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import EmployeeRepository from './repository';

type Employee = typeof employees.$inferInsert;

class EmployeeService {
	private repository: EmployeeRepository;

	constructor() {
		this.repository = new EmployeeRepository();
	}

	async get(empNo: string) {
		return withAuth(
			async () => this.repository.findByEmpNo(empNo),
			['human_resource', 'admin']
		);
	}

	async findAll(page = 1, search = '') {
		return withAuth(
			async () =>
				this.repository.query({
					page,
					search,
					searchColumns: ['empNo', 'name'],
					sort: [{ column: 'createdAt', order: 'desc' }],
				}),
			['human_resource', 'admin']
		);
	}

	async create(data: Employee) {
		return withAuth(
			async (session) =>
				this.repository.create(data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_creation',
				}),
			['human_resource', 'admin']
		);
	}

	async update(empNo: string, data: Employee) {
		return withAuth(
			async (session) =>
				this.repository.update(empNo, data, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_update',
				}),
			['human_resource', 'admin']
		);
	}

	async delete(empNo: string) {
		return withAuth(
			async (session) =>
				this.repository.delete(empNo, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_delete',
				}),
			['admin']
		);
	}
}

export const employeesService = serviceWrapper(
	EmployeeService,
	'EmployeeService'
);
