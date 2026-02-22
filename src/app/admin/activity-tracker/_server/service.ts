import type { Session } from 'next-auth';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import { isClearanceDepartment } from '../_lib/department-tables';
import type { DateRange } from '../_lib/types';
import ActivityTrackerRepository from './repository';

class ActivityTrackerService {
	private readonly repository: ActivityTrackerRepository;

	constructor() {
		this.repository = new ActivityTrackerRepository();
	}

	async getDepartmentSummary(dateRange: DateRange, overrideDept?: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getDepartmentSummary(dept, dateRange);
		}, this.accessCheck);
	}

	async getEmployeeList(
		dateRange: DateRange,
		page: number,
		search: string,
		overrideDept?: string
	) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getEmployeeList(dept, dateRange, page, search);
		}, this.accessCheck);
	}

	async getEmployeeActivity(userId: string, dateRange: DateRange) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept !== 'all') {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeActivity(userId, dateRange);
		}, this.accessCheck);
	}

	async getEmployeeTimeline(
		userId: string,
		dateRange: DateRange,
		page: number
	) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept !== 'all') {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeTimeline(userId, dateRange, page);
		}, this.accessCheck);
	}

	async getActivityHeatmap(userId: string, dateRange: DateRange) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept !== 'all') {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getActivityHeatmap(userId, dateRange);
		}, this.accessCheck);
	}

	async getDailyTrends(dateRange: DateRange, overrideDept?: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getDailyTrends(dept, dateRange);
		}, this.accessCheck);
	}

	async getEntityBreakdown(userId: string, dateRange: DateRange) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept !== 'all') {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEntityBreakdown(userId, dateRange);
		}, this.accessCheck);
	}

	async getClearanceStats(dateRange: DateRange, overrideDept?: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			if (dept !== 'all' && !isClearanceDepartment(dept)) {
				throw new Error('Clearance stats not available for this department');
			}
			return this.repository.getClearanceStats(dept, dateRange);
		}, this.accessCheck);
	}

	private accessCheck = async (session: Session): Promise<boolean> => {
		if (!session.user) return false;
		if (session.user.role === 'admin') return true;
		return session.user.position === 'manager';
	};

	private resolveDepartment(
		session: Session | null | undefined,
		overrideDept?: string
	): string {
		if (!session?.user) throw new Error('Unauthorized');
		if (session.user.role === 'admin') {
			return overrideDept || 'all';
		}
		return session.user.role;
	}

	private async verifyEmployeeBelongsToDept(userId: string, dept: string) {
		const belongs = await this.repository.isUserInDepartment(userId, dept);
		if (!belongs) {
			throw new Error('Employee does not belong to your department');
		}
	}
}

export const activityTrackerService = serviceWrapper(
	ActivityTrackerService,
	'ActivityTrackerService'
);
