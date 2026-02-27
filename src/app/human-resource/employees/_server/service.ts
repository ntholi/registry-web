import type { employees } from '@/core/database';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth, { requireSessionUserId } from '@/core/platform/withAuth';
import EmployeeRepository from './repository';

type Employee = typeof employees.$inferInsert;
type EmployeeWithSchools = Employee & { schoolIds?: number[] };

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

	async create(data: EmployeeWithSchools) {
		return withAuth(
			async (session) => {
				const { schoolIds, ...employee } = data;
				const created = await this.repository.create(employee, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_creation',
				});
				if (schoolIds && schoolIds.length > 0) {
					await this.repository.updateSchools(created.empNo, schoolIds);
				}
				return created;
			},
			['human_resource', 'admin']
		);
	}

	async update(empNo: string, data: EmployeeWithSchools) {
		return withAuth(
			async (session) => {
				const { schoolIds, ...employee } = data;
				const updated = await this.repository.update(empNo, employee, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_update',
				});
				if (schoolIds !== undefined) {
					await this.repository.updateSchools(empNo, schoolIds);
				}
				return updated;
			},
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

	async logCardPrint(empNo: string) {
		return withAuth(
			async (session) => {
				await this.repository.logCardPrint(empNo, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_card_print',
				});
			},
			['human_resource', 'admin']
		);
	}

	async getCardPrintHistory(empNo: string) {
		return withAuth(
			async () => this.repository.findCardPrintHistory(empNo),
			['human_resource', 'admin']
		);
	}
}

export const employeesService = serviceWrapper(
	EmployeeService,
	'EmployeeService'
);
