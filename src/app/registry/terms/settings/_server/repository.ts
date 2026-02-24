import { and, eq, inArray, ne } from 'drizzle-orm';
import {
	blockedStudents,
	clearance,
	db,
	publicationAttachments,
	registrationClearance,
	registrationRequests,
	termSettings,
	terms,
} from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

export type TermSettingsInsert = typeof termSettings.$inferInsert;
export type TermSettingsSelect = typeof termSettings.$inferSelect;

export default class TermSettingsRepository extends BaseRepository<
	typeof termSettings,
	'id'
> {
	constructor() {
		super(termSettings, termSettings.id);
	}

	async findByTermId(termId: number) {
		return db.query.termSettings.findFirst({
			where: eq(termSettings.termId, termId),
		});
	}

	async updateResultsPublished(
		termId: number,
		published: boolean,
		userId: string,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(termSettings)
				.where(eq(termSettings.termId, termId));

			const [updated] = await tx
				.update(termSettings)
				.set({
					resultsPublished: published,
					updatedAt: new Date(),
					updatedBy: userId,
				})
				.where(eq(termSettings.termId, termId))
				.returning();

			if (audit && updated) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(updated.id),
					existing ?? null,
					updated,
					audit
				);
			}

			return updated;
		});
	}

	async updateGradebookAccess(
		termId: number,
		access: boolean,
		userId: string,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(termSettings)
				.where(eq(termSettings.termId, termId));

			const [updated] = await tx
				.update(termSettings)
				.set({
					lecturerGradebookAccess: access,
					updatedAt: new Date(),
					updatedBy: userId,
				})
				.where(eq(termSettings.termId, termId))
				.returning();

			if (audit && updated) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(updated.id),
					existing ?? null,
					updated,
					audit
				);
			}

			return updated;
		});
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

	async getPublicationAttachments(termCode: string) {
		return db.query.publicationAttachments.findMany({
			where: eq(publicationAttachments.termCode, termCode),
			orderBy: (t, { desc }) => [desc(t.createdAt)],
		});
	}

	async createPublicationAttachment(data: {
		termCode: string;
		fileName: string;
		type: 'scanned-pdf' | 'raw-marks' | 'other';
		createdBy: string;
	}) {
		const [result] = await db
			.insert(publicationAttachments)
			.values(data)
			.returning();
		return result;
	}

	async deletePublicationAttachment(id: string) {
		return db
			.delete(publicationAttachments)
			.where(eq(publicationAttachments.id, id));
	}
}

export const termSettingsRepository = new TermSettingsRepository();
