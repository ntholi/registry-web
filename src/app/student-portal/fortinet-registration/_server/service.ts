import { getStudentByUserId } from '@registry/students';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import {
	hasSessionRole,
	isStudentSession,
} from '@/core/auth/sessionPermissions';
import type { fortinetLevel, fortinetRegistrations } from '@/core/database';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withPermission from '@/core/platform/withPermission';
import FortinetRegistrationRepository from './repository';

type FortinetRegistration = typeof fortinetRegistrations.$inferInsert;
type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

class FortinetRegistrationService {
	constructor(
		private readonly repository = new FortinetRegistrationRepository()
	) {}

	async getById(id: number) {
		return withPermission(
			async () => this.repository.findById(id),
			async (session) =>
				isStudentSession(session) || hasSessionRole(session, DASHBOARD_ROLES)
		);
	}

	async getByStudentNumber(stdNo: number) {
		return withPermission(
			async () => this.repository.findByStudentNumber(stdNo),
			async (session) =>
				isStudentSession(session) || hasSessionRole(session, DASHBOARD_ROLES)
		);
	}

	async getForCurrentStudent() {
		return withPermission(
			async (session) => {
				if (!session?.user?.id) {
					throw new Error('User session not found');
				}
				const student = await getStudentByUserId(session.user.id);
				if (!student) {
					throw new Error('Student not found');
				}
				return this.repository.findByStudentNumber(student.stdNo);
			},
			async (session) => isStudentSession(session)
		);
	}

	async getForSchool(
		schoolId: number,
		options?: QueryOptions<typeof fortinetRegistrations>
	) {
		return withPermission(
			async () => this.repository.findForSchool(schoolId, options),
			'dashboard'
		);
	}

	async create(data: { level: FortinetLevel; message?: string }) {
		return withPermission(
			async (session) => {
				if (!session?.user?.id) {
					throw new Error('User session not found');
				}
				const student = await getStudentByUserId(session.user.id);
				if (!student) {
					throw new Error('Student not found');
				}

				const hasICTSchool = student.programs?.some(
					(program) => program.structure.program.school.id === 8
				);

				if (!hasICTSchool) {
					throw new Error(
						'Fortinet registration is only available for ICT students'
					);
				}

				const existing = await this.repository.findByStudentAndLevel(
					student.stdNo,
					data.level
				);

				if (existing) {
					throw new Error(
						`You have already registered for ${data.level.toUpperCase()}`
					);
				}

				const registrationData: FortinetRegistration = {
					stdNo: student.stdNo,
					schoolId: 8,
					level: data.level,
					message: data.message,
					status: 'pending',
				};

				return this.repository.create(registrationData);
			},
			async (session) => isStudentSession(session)
		);
	}

	async updateStatus(
		id: number,
		status: 'pending' | 'approved' | 'rejected' | 'completed',
		message?: string
	) {
		return withPermission(async () => {
			const updateData = {
				status,
				message,
				updatedAt: new Date(),
			};

			await this.repository.update(id, updateData);
			return this.repository.findById(id);
		}, 'dashboard');
	}

	async delete(id: number) {
		return withPermission(async () => {
			const registration = await this.repository.findById(id);
			await this.repository.delete(id);
			return registration;
		}, 'dashboard');
	}

	async count() {
		return withPermission(async () => this.repository.count(), 'dashboard');
	}

	async getAll(options?: QueryOptions<typeof fortinetRegistrations>) {
		return withPermission(
			async () => this.repository.query(options || {}),
			'dashboard'
		);
	}
}

export const fortinetRegistrationService = serviceWrapper(
	FortinetRegistrationService,
	'FortinetRegistrationService'
);
