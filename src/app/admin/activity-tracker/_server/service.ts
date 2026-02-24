import type { Session } from 'next-auth';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import ActivityTrackerRepository from './repository';

class ActivityTrackerService {
	private readonly repository: ActivityTrackerRepository;

	constructor() {
		this.repository = new ActivityTrackerRepository();
	}

	async getDepartmentSummary(start: Date, end: Date, overrideDept?: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getDepartmentSummary(start, end, dept);
		}, this.accessCheck);
	}

	async getEmployeeList(
		start: Date,
		end: Date,
		page: number,
		search: string,
		overrideDept?: string
	) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getEmployeeList(start, end, page, search, dept);
		}, this.accessCheck);
	}

	async getEmployeeActivityBreakdown(userId: string, start: Date, end: Date) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept) {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeActivityBreakdown(userId, start, end);
		}, this.accessCheck);
	}

	async getEmployeeTimeline(
		userId: string,
		start: Date,
		end: Date,
		page: number
	) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept) {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeTimeline(userId, start, end, page);
		}, this.accessCheck);
	}

	async getActivityHeatmap(userId: string, start: Date, end: Date) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept) {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getActivityHeatmap(userId, start, end);
		}, this.accessCheck);
	}

	async getDailyTrends(start: Date, end: Date, overrideDept?: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session, overrideDept);
			return this.repository.getDailyTrends(start, end, dept);
		}, this.accessCheck);
	}

	async getEmployeeUser(userId: string) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept) {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeUser(userId);
		}, this.accessCheck);
	}

	async getEmployeeTotalActivities(userId: string, start: Date, end: Date) {
		return withAuth(async (session) => {
			const dept = this.resolveDepartment(session);
			if (dept) {
				await this.verifyEmployeeBelongsToDept(userId, dept);
			}
			return this.repository.getEmployeeTotalActivities(userId, start, end);
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
	): string | undefined {
		if (!session?.user) throw new Error('Unauthorized');
		if (session.user.role === 'admin') {
			return overrideDept || undefined;
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
