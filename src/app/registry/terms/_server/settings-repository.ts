import { and, eq, inArray, ne } from 'drizzle-orm';
import {
	blockedStudents,
	clearance,
	db,
	registrationClearance,
	registrationRequests,
	termSettings,
	terms,
} from '@/core/database';

export type TermSettingsInsert = typeof termSettings.$inferInsert;
export type TermSettingsSelect = typeof termSettings.$inferSelect;

export default class TermSettingsRepository {
	async findByTermId(termId: number) {
		return db.query.termSettings.findFirst({
			where: eq(termSettings.termId, termId),
		});
	}

	async updateResultsPublished(
		termId: number,
		published: boolean,
		userId: string
	) {
		const [updated] = await db
			.update(termSettings)
			.set({
				resultsPublished: published,
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(eq(termSettings.termId, termId))
			.returning();
		return updated;
	}

	async updateGradebookAccess(termId: number, access: boolean, userId: string) {
		const [updated] = await db
			.update(termSettings)
			.set({
				lecturerGradebookAccess: access,
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(eq(termSettings.termId, termId))
			.returning();
		return updated;
	}

	async updateRegistrationDates(
		termId: number,
		startDate: string | null,
		endDate: string | null,
		userId: string
	) {
		const [updated] = await db
			.insert(termSettings)
			.values({
				termId,
				registrationStartDate: startDate,
				registrationEndDate: endDate,
				createdBy: userId,
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.onConflictDoUpdate({
				target: termSettings.termId,
				set: {
					registrationStartDate: startDate,
					registrationEndDate: endDate,
					updatedAt: new Date(),
					updatedBy: userId,
				},
			})
			.returning();
		return updated;
	}

	async getRejectedStudentsForTerm(termId: number) {
		const rejected = await db
			.select({
				stdNo: registrationRequests.stdNo,
				department: clearance.department,
				message: clearance.message,
			})
			.from(registrationRequests)
			.innerJoin(
				registrationClearance,
				eq(registrationClearance.registrationRequestId, registrationRequests.id)
			)
			.innerJoin(clearance, eq(clearance.id, registrationClearance.clearanceId))
			.where(
				and(
					eq(registrationRequests.termId, termId),
					eq(clearance.status, 'rejected')
				)
			);
		return rejected;
	}

	async getAlreadyBlockedStudents(stdNos: number[]) {
		if (stdNos.length === 0) return [];
		return db
			.select({ stdNo: blockedStudents.stdNo })
			.from(blockedStudents)
			.where(
				and(
					inArray(blockedStudents.stdNo, stdNos),
					eq(blockedStudents.status, 'blocked')
				)
			);
	}

	async bulkCreateBlockedStudents(
		data: { stdNo: number; reason: string; byDepartment: string }[]
	) {
		if (data.length === 0) return [];
		return db
			.insert(blockedStudents)
			.values(
				data.map((d) => ({
					stdNo: d.stdNo,
					reason: d.reason,
					byDepartment: d.byDepartment as 'registry',
				}))
			)
			.returning();
	}

	async publishAllPreviousTerms(activeTermId: number) {
		return db
			.update(termSettings)
			.set({ resultsPublished: true })
			.where(ne(termSettings.termId, activeTermId));
	}

	async getUnpublishedTermCodes() {
		const results = await db
			.select({ code: terms.code })
			.from(termSettings)
			.innerJoin(terms, eq(terms.id, termSettings.termId))
			.where(eq(termSettings.resultsPublished, false));
		return results.map((r) => r.code);
	}
}

export const termSettingsRepository = new TermSettingsRepository();
