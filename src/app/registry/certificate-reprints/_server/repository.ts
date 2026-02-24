import { certificateReprints } from '@registry/_database';
import { desc, eq } from 'drizzle-orm';
import { auditLogs, db } from '@/core/database';
import type { AuditOptions } from '@/core/platform/BaseRepository';

type CertificateReprint = typeof certificateReprints.$inferInsert;

class CertificateReprintsRepository {
	async findById(id: number) {
		return db.query.certificateReprints.findFirst({
			where: eq(certificateReprints.id, id),
			with: {
				student: true,
				createdByUser: true,
			},
		});
	}

	async findByStdNo(stdNo: number) {
		return db.query.certificateReprints.findMany({
			where: eq(certificateReprints.stdNo, stdNo),
			with: {
				createdByUser: true,
			},
			orderBy: [desc(certificateReprints.createdAt)],
		});
	}

	async create(data: CertificateReprint, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const [result] = await tx
				.insert(certificateReprints)
				.values(data)
				.returning();

			if (audit) {
				await tx.insert(auditLogs).values({
					tableName: 'certificate_reprints',
					recordId: String(result.id),
					operation: 'INSERT',
					oldValues: null,
					newValues: result,
					changedBy: audit.userId,
					activityType: audit.activityType ?? null,
				});
			}

			return result;
		});
	}

	async update(
		id: number,
		data: Partial<CertificateReprint>,
		audit?: AuditOptions
	) {
		return db.transaction(async (tx) => {
			const existing = audit
				? await tx
						.select()
						.from(certificateReprints)
						.where(eq(certificateReprints.id, id))
						.then((r) => r[0])
				: undefined;

			const [result] = await tx
				.update(certificateReprints)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(certificateReprints.id, id))
				.returning();

			if (audit && existing) {
				await tx.insert(auditLogs).values({
					tableName: 'certificate_reprints',
					recordId: String(id),
					operation: 'UPDATE',
					oldValues: existing,
					newValues: result,
					changedBy: audit.userId,
					activityType: audit.activityType ?? null,
				});
			}

			return result;
		});
	}

	async delete(id: number, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			const existing = audit
				? await tx
						.select()
						.from(certificateReprints)
						.where(eq(certificateReprints.id, id))
						.then((r) => r[0])
				: undefined;

			await tx
				.delete(certificateReprints)
				.where(eq(certificateReprints.id, id));

			if (audit && existing) {
				await tx.insert(auditLogs).values({
					tableName: 'certificate_reprints',
					recordId: String(id),
					operation: 'DELETE',
					oldValues: existing,
					newValues: null,
					changedBy: audit.userId,
					activityType: audit.activityType ?? null,
				});
			}
		});
	}
}

export default CertificateReprintsRepository;
