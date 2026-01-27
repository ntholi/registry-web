import { and, eq, inArray } from 'drizzle-orm';
import {
	db,
	termRegistrationPrograms,
	termRegistrations,
} from '@/core/database';

export type TermRegistrationInsert = typeof termRegistrations.$inferInsert;
export type TermRegistrationSelect = typeof termRegistrations.$inferSelect;
export type TermRegProgramInsert = typeof termRegistrationPrograms.$inferInsert;

export default class TermRegistrationsRepository {
	async findByTermId(termId: number) {
		return db.query.termRegistrations.findMany({
			where: eq(termRegistrations.termId, termId),
			with: {
				school: true,
				programs: {
					with: { program: true },
				},
			},
		});
	}

	async findByTermIdAndSchoolId(termId: number, schoolId: number) {
		return db.query.termRegistrations.findFirst({
			where: and(
				eq(termRegistrations.termId, termId),
				eq(termRegistrations.schoolId, schoolId)
			),
			with: {
				programs: {
					with: { program: true },
				},
			},
		});
	}

	async create(data: TermRegistrationInsert, programIds?: number[]) {
		return db.transaction(async (tx) => {
			const [registration] = await tx
				.insert(termRegistrations)
				.values(data)
				.returning();

			if (programIds && programIds.length > 0) {
				await tx.insert(termRegistrationPrograms).values(
					programIds.map((programId) => ({
						termRegistrationId: registration.id,
						programId,
					}))
				);
			}

			return registration;
		});
	}

	async update(
		id: number,
		data: Partial<TermRegistrationInsert>,
		programIds?: number[]
	) {
		return db.transaction(async (tx) => {
			const [updated] = await tx
				.update(termRegistrations)
				.set(data)
				.where(eq(termRegistrations.id, id))
				.returning();

			if (programIds !== undefined) {
				await tx
					.delete(termRegistrationPrograms)
					.where(eq(termRegistrationPrograms.termRegistrationId, id));

				if (programIds.length > 0) {
					await tx.insert(termRegistrationPrograms).values(
						programIds.map((programId) => ({
							termRegistrationId: id,
							programId,
						}))
					);
				}
			}

			return updated;
		});
	}

	async delete(id: number) {
		return db
			.delete(termRegistrations)
			.where(eq(termRegistrations.id, id))
			.returning();
	}

	async deleteByTermIdAndSchoolId(termId: number, schoolId: number) {
		return db
			.delete(termRegistrations)
			.where(
				and(
					eq(termRegistrations.termId, termId),
					eq(termRegistrations.schoolId, schoolId)
				)
			)
			.returning();
	}

	async canStudentRegister(
		termId: number,
		schoolId: number,
		programId: number
	) {
		const registration = await db.query.termRegistrations.findFirst({
			where: and(
				eq(termRegistrations.termId, termId),
				eq(termRegistrations.schoolId, schoolId)
			),
			with: {
				programs: true,
			},
		});

		if (!registration) {
			return { allowed: false, reason: 'School not open for registration' };
		}

		const today = new Date().toISOString().split('T')[0];
		if (today < registration.startDate || today > registration.endDate) {
			return { allowed: false, reason: 'Registration period closed' };
		}

		if (registration.programs.length > 0) {
			const programAllowed = registration.programs.some(
				(p) => p.programId === programId
			);
			if (!programAllowed) {
				return { allowed: false, reason: 'Program not open for registration' };
			}
		}

		return { allowed: true, reason: null };
	}

	async getRegistrationStatus(termId: number, schoolId: number) {
		const registration = await this.findByTermIdAndSchoolId(termId, schoolId);
		if (!registration) return null;

		const today = new Date().toISOString().split('T')[0];
		const isOpen =
			today >= registration.startDate && today <= registration.endDate;

		return {
			...registration,
			isOpen,
		};
	}

	async upsert(data: TermRegistrationInsert, programIds?: number[]) {
		const existing = await this.findByTermIdAndSchoolId(
			data.termId,
			data.schoolId
		);
		if (existing) {
			return this.update(existing.id, data, programIds);
		}
		return this.create(data, programIds);
	}

	async bulkUpsert(
		termId: number,
		entries: {
			schoolId: number;
			startDate: string;
			endDate: string;
			programIds?: number[];
		}[],
		userId?: string
	) {
		return db.transaction(async (tx) => {
			const results = [];

			for (const entry of entries) {
				const existing = await tx.query.termRegistrations.findFirst({
					where: and(
						eq(termRegistrations.termId, termId),
						eq(termRegistrations.schoolId, entry.schoolId)
					),
				});

				let registration: typeof termRegistrations.$inferSelect;
				if (existing) {
					[registration] = await tx
						.update(termRegistrations)
						.set({
							startDate: entry.startDate,
							endDate: entry.endDate,
						})
						.where(eq(termRegistrations.id, existing.id))
						.returning();

					await tx
						.delete(termRegistrationPrograms)
						.where(
							eq(termRegistrationPrograms.termRegistrationId, existing.id)
						);
				} else {
					[registration] = await tx
						.insert(termRegistrations)
						.values({
							termId,
							schoolId: entry.schoolId,
							startDate: entry.startDate,
							endDate: entry.endDate,
							createdBy: userId,
						})
						.returning();
				}

				if (entry.programIds && entry.programIds.length > 0) {
					await tx.insert(termRegistrationPrograms).values(
						entry.programIds.map((programId) => ({
							termRegistrationId: registration.id,
							programId,
						}))
					);
				}

				results.push(registration);
			}

			return results;
		});
	}

	async deleteByTermIdAndSchoolIds(termId: number, schoolIds: number[]) {
		if (schoolIds.length === 0) return [];
		return db
			.delete(termRegistrations)
			.where(
				and(
					eq(termRegistrations.termId, termId),
					inArray(termRegistrations.schoolId, schoolIds)
				)
			)
			.returning();
	}
}

export const termRegistrationsRepository = new TermRegistrationsRepository();
