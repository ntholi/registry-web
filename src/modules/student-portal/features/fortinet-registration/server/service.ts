import { getStudentByUserId } from '@registry/students/server';
import type {
	fortinetLevel,
	fortinetRegistrations,
} from '@/core/database/schema';
import type { QueryOptions } from '@/core/platform/BaseRepository';
import { serviceWrapper } from '@/core/platform/serviceWrapper';
import withAuth from '@/core/platform/withAuth';
import FortinetRegistrationRepository from './repository';

type FortinetRegistration = typeof fortinetRegistrations.$inferInsert;
type FortinetLevel = (typeof fortinetLevel.enumValues)[number];

class FortinetRegistrationService {
	constructor(
		private readonly repository = new FortinetRegistrationRepository()
	) {}

	async getById(id: number) {
		return withAuth(
			async () => this.repository.findById(id),
			['student', 'dashboard']
		);
	}

	async getByStudentNumber(stdNo: number) {
		return withAuth(
			async () => this.repository.findByStudentNumber(stdNo),
			['student', 'dashboard']
		);
	}

	async getForCurrentStudent() {
		return withAuth(
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
			['student']
		);
	}

	async getForSchool(
		schoolId: number,
		options?: QueryOptions<typeof fortinetRegistrations>
	) {
		return withAuth(
			async () => this.repository.findForSchool(schoolId, options),
			['dashboard']
		);
	}

	async create(data: { level: FortinetLevel; message?: string }) {
		return withAuth(
			async (session) => {
				if (!session?.user?.id) {
					throw new Error('User session not found');
				}
				const student = await getStudentByUserId(session.user.id);
				if (!student) {
					throw new Error('Student not found');
				}

				// Check if student belongs to school 8 (Faculty of Information & Communication Technology)
				const hasICTSchool = student.programs?.some(
					(program) => program.structure.program.school.id === 8
				);

				if (!hasICTSchool) {
					throw new Error(
						'Fortinet registration is only available for ICT students'
					);
				}

				// Check if student already registered for this level
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
					schoolId: 8, // Faculty of Information & Communication Technology
					level: data.level,
					message: data.message,
					status: 'pending',
				};

				return this.repository.create(registrationData);
			},
			['student']
		);
	}

	async updateStatus(
		id: number,
		status: 'pending' | 'approved' | 'rejected' | 'completed',
		message?: string
	) {
		return withAuth(async () => {
			const updateData = {
				status,
				message,
				updatedAt: new Date(),
			};

			await this.repository.update(id, updateData);
			return this.repository.findById(id);
		}, ['dashboard']);
	}

	async delete(id: number) {
		return withAuth(async () => {
			const registration = await this.repository.findById(id);
			await this.repository.delete(id);
			return registration;
		}, ['dashboard']);
	}

	async count() {
		return withAuth(async () => this.repository.count(), ['dashboard']);
	}

	async getAll(options?: QueryOptions<typeof fortinetRegistrations>) {
		return withAuth(
			async () => this.repository.query(options || {}),
			['dashboard']
		);
	}
}

export const fortinetRegistrationService = serviceWrapper(
	FortinetRegistrationService,
	'FortinetRegistrationService'
);
