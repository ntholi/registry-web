import { count, eq, ilike, or } from 'drizzle-orm';
import {
	applicantPhones,
	applicants,
	db,
	guardianPhones,
	guardians,
} from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class ApplicantRepository extends BaseRepository<
	typeof applicants,
	'id'
> {
	constructor() {
		super(applicants, applicants.id);
	}

	override async findById(id: string) {
		return db.query.applicants.findFirst({
			where: eq(applicants.id, id),
			with: {
				phones: true,
				guardians: { with: { phones: true } },
				academicRecords: {
					with: {
						certificateType: true,
						subjectGrades: { with: { subject: true } },
					},
				},
				documents: true,
			},
		});
	}

	async findByNationalId(nationalId: string) {
		return db.query.applicants.findFirst({
			where: eq(applicants.nationalId, nationalId),
		});
	}

	async search(page: number, search: string) {
		const pageSize = 15;
		const offset = (page - 1) * pageSize;

		const where = search
			? or(
					ilike(applicants.fullName, `%${search}%`),
					ilike(applicants.nationalId, `%${search}%`)
				)
			: undefined;

		const [items, [{ total }]] = await Promise.all([
			db.query.applicants.findMany({
				where,
				limit: pageSize,
				offset,
				orderBy: (a, { desc }) => [desc(a.createdAt)],
			}),
			db
				.select({ total: count() })
				.from(applicants)
				.where(where ?? undefined),
		]);

		return {
			items,
			totalPages: Math.ceil(total / pageSize),
			totalItems: total,
		};
	}

	async addPhone(applicantId: string, phoneNumber: string) {
		const [phone] = await db
			.insert(applicantPhones)
			.values({ applicantId, phoneNumber })
			.returning();
		return phone;
	}

	async removePhone(phoneId: number) {
		await db.delete(applicantPhones).where(eq(applicantPhones.id, phoneId));
	}

	async createGuardian(data: typeof guardians.$inferInsert) {
		const [guardian] = await db.insert(guardians).values(data).returning();
		return guardian;
	}

	async updateGuardian(
		id: number,
		data: Partial<typeof guardians.$inferInsert>
	) {
		const [guardian] = await db
			.update(guardians)
			.set(data)
			.where(eq(guardians.id, id))
			.returning();
		return guardian;
	}

	async deleteGuardian(id: number) {
		await db.delete(guardians).where(eq(guardians.id, id));
	}

	async addGuardianPhone(guardianId: number, phoneNumber: string) {
		const [phone] = await db
			.insert(guardianPhones)
			.values({ guardianId, phoneNumber })
			.returning();
		return phone;
	}

	async removeGuardianPhone(phoneId: number) {
		await db.delete(guardianPhones).where(eq(guardianPhones.id, phoneId));
	}
}
