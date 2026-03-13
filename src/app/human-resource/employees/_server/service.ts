import type { employees } from '@/core/database';
import { deleteFile, uploadFile } from '@/core/integrations/storage';
import { StoragePaths } from '@/core/integrations/storage-utils';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission, {
	requireSessionUserId,
} from '@/core/platform/withPermission';
import EmployeeRepository from './repository';

type Employee = typeof employees.$inferInsert;
type EmployeeWithSchools = Employee & { schoolIds?: number[] };

class EmployeeService {
	private repository: EmployeeRepository;

	constructor() {
		this.repository = new EmployeeRepository();
	}

	async get(empNo: string) {
		return withPermission(async () => this.repository.findByEmpNo(empNo), {
			employees: ['read'],
		});
	}

	async findAll(page = 1, search = '') {
		return withPermission(
			async () =>
				this.repository.query({
					page,
					search,
					searchColumns: ['empNo', 'name'],
					sort: [{ column: 'createdAt', order: 'desc' }],
				}),
			{ employees: ['read'] }
		);
	}

	async create(data: EmployeeWithSchools) {
		return withPermission(
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
			{ employees: ['create'] }
		);
	}

	async update(empNo: string, data: EmployeeWithSchools) {
		return withPermission(
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
			{ employees: ['update'] }
		);
	}

	async delete(empNo: string) {
		return withPermission(
			async (session) =>
				this.repository.delete(empNo, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_delete',
				}),
			{ employees: ['delete'] }
		);
	}

	async logCardPrint(empNo: string) {
		return withPermission(
			async (session) => {
				await this.repository.logCardPrint(empNo, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_card_print',
				});
			},
			{ employees: ['update'] }
		);
	}

	async getCardPrintHistory(empNo: string) {
		return withPermission(
			async () => this.repository.findCardPrintHistory(empNo),
			{ employees: ['read'] }
		);
	}

	async getPhotoKey(empNo: string) {
		return withPermission(
			async () => this.repository.findPhotoKey(empNo),
			'all'
		);
	}

	async uploadPhoto(empNo: string, photo: File) {
		return withPermission(
			async (session) => {
				const existingKey = await this.repository.findPhotoKey(empNo);
				if (existingKey) {
					await deleteFile(existingKey);
				}

				const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
				const key = StoragePaths.employeePhoto(empNo, ext);
				await uploadFile(photo, key);

				return this.repository.updatePhotoKey(empNo, key, {
					userId: requireSessionUserId(session),
					role: session!.user!.role!,
					activityType: 'employee_update',
				});
			},
			{ employees: ['update'] }
		);
	}
}

export const employeesService = serviceWrapper(
	EmployeeService,
	'EmployeeService'
);
