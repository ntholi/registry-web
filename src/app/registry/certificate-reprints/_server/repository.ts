import { certificateReprints } from '@registry/_database';
import { studentPrograms } from '@registry/students/_schema/studentPrograms';
import { and, count, desc, eq, isNotNull, sql } from 'drizzle-orm';
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

	async findById(id: string) {
		return db.query.certificateReprints.findFirst({
			where: eq(certificateReprints.id, id),
			with: {
				student: true,
				createdByUser: true,
				receivedByUser: true,
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

	async queryPaginated(page = 1, search = '', size = 10) {
		const offset = (page - 1) * size;
		const where = search
			? sql`${certificateReprints.stdNo}::text ILIKE ${`%${search}%`} OR ${certificateReprints.receiptNumber}::text ILIKE ${`%${search}%`}`
			: undefined;

		const items = await db.query.certificateReprints.findMany({
			where,
			with: { student: true, createdByUser: true },
			orderBy: [desc(certificateReprints.createdAt)],
			limit: size,
			offset,
		});

		const [result] = await db
			.select({ count: count() })
			.from(certificateReprints)
			.where(where);

		const totalItems = result?.count ?? 0;
		return {
			items,
			totalPages: Math.ceil(totalItems / size),
			totalItems,
		};
	}

	async hasGraduationDate(stdNo: number) {
		const [result] = await db
			.select({ count: count() })
			.from(studentPrograms)
			.where(
				and(
					eq(studentPrograms.stdNo, stdNo),
					isNotNull(studentPrograms.graduationDate)
				)
			);
		return (result?.count ?? 0) > 0;
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
		id: string,
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

	async delete(id: string, audit?: AuditOptions) {
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
