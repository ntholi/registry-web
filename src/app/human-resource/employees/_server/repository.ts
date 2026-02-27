import { eq } from 'drizzle-orm';
import { db, employees } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class EmployeeRepository extends BaseRepository<
	typeof employees,
	'empNo'
> {
	constructor() {
		super(employees, employees.empNo);
	}

	async findByEmpNo(empNo: string) {
		return db.query.employees.findFirst({
			where: eq(employees.empNo, empNo),
			with: {
				user: true,
				school: true,
			},
		});
	}
}
