import type { Session } from '@/core/auth';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import ActivityTrackerRepository from './repository';

class ActivityTrackerService {
	private readonly repository: ActivityTrackerRepository;

	constructor() {
		this.repository = new ActivityTrackerRepository();
	}

	async getDepartmentSummary(start: Date, end: Date, overrideDept?: string) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session, overrideDept);
				return this.repository.getDepartmentSummary(start, end, dept);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getEmployeeList(
		start: Date,
		end: Date,
		page: number,
		search: string,
		overrideDept?: string
	) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session, overrideDept);
				return this.repository.getEmployeeList(start, end, page, search, dept);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getEmployeeActivityBreakdown(userId: string, start: Date, end: Date) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session);
				if (dept) {
					await this.verifyEmployeeBelongsToDept(userId, dept);
				}
				return this.repository.getEmployeeActivityBreakdown(userId, start, end);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getEmployeeTimeline(
		userId: string,
		start: Date,
		end: Date,
		page: number
	) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session);
				if (dept) {
					await this.verifyEmployeeBelongsToDept(userId, dept);
				}
				return this.repository.getEmployeeTimeline(userId, start, end, page);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getActivityHeatmap(userId: string, start: Date, end: Date) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session);
				if (dept) {
					await this.verifyEmployeeBelongsToDept(userId, dept);
				}
				return this.repository.getActivityHeatmap(userId, start, end);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getDailyTrends(start: Date, end: Date, overrideDept?: string) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session, overrideDept);
				return this.repository.getDailyTrends(start, end, dept);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getEmployeeUser(userId: string) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session);
				if (dept) {
					await this.verifyEmployeeBelongsToDept(userId, dept);
				}
				return this.repository.getEmployeeUser(userId);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

	async getEmployeeTotalActivities(userId: string, start: Date, end: Date) {
		return withPermission(
			async (session) => {
				const dept = this.resolveDepartment(session);
				if (dept) {
					await this.verifyEmployeeBelongsToDept(userId, dept);
				}
				return this.repository.getEmployeeTotalActivities(userId, start, end);
			},
			{ 'activity-tracker': ['read'] }
		);
	}

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
