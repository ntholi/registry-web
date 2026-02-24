import { certificateReprints } from '@registry/_database';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/core/database';
import BaseRepository, {
	type AuditOptions,
} from '@/core/platform/BaseRepository';

type CertificateReprint = typeof certificateReprints.$inferInsert;

class CertificateReprintsRepository extends BaseRepository<
	typeof certificateReprints,
	'id'
> {
	constructor() {
		super(certificateReprints, certificateReprints.id);
	}

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
				await this.writeAuditLog(
					tx,
					'INSERT',
					String(result.id),
					null,
					result,
					audit
				);
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
			let existing: typeof certificateReprints.$inferSelect | undefined;
			if (audit) {
				const [row] = await tx
					.select()
					.from(certificateReprints)
					.where(eq(certificateReprints.id, id));
				existing = row;
			}

			const [result] = await tx
				.update(certificateReprints)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(certificateReprints.id, id))
				.returning();

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'UPDATE',
					String(id),
					existing,
					result,
					audit
				);
			}

			return result;
		});
	}

	async delete(id: number, audit?: AuditOptions) {
		return db.transaction(async (tx) => {
			let existing: typeof certificateReprints.$inferSelect | undefined;
			if (audit) {
				const [row] = await tx
					.select()
					.from(certificateReprints)
					.where(eq(certificateReprints.id, id));
				existing = row;
			}

			await tx
				.delete(certificateReprints)
				.where(eq(certificateReprints.id, id));

			if (audit && existing) {
				await this.writeAuditLog(
					tx,
					'DELETE',
					String(id),
					existing,
					null,
					audit
				);
			}
		});
	}
}

export default CertificateReprintsRepository;
