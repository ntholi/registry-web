import { certificateReprints } from '@registry/_database';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/core/database';

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

	async create(data: CertificateReprint) {
		const [result] = await db
			.insert(certificateReprints)
			.values(data)
			.returning();
		return result;
	}

	async update(id: number, data: Partial<CertificateReprint>) {
		const [result] = await db
			.update(certificateReprints)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(certificateReprints.id, id))
			.returning();
		return result;
	}

	async delete(id: number) {
		return db.delete(certificateReprints).where(eq(certificateReprints.id, id));
	}
}

export default CertificateReprintsRepository;
