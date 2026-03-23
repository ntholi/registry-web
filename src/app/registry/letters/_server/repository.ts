import { and, eq } from 'drizzle-orm';
import type { DashboardRole } from '@/core/auth/permissions';
import { db, letterTemplates } from '@/core/database';
import BaseRepository from '@/core/platform/BaseRepository';

export default class LetterTemplateRepository extends BaseRepository<
	typeof letterTemplates,
	'id'
> {
	constructor() {
		super(letterTemplates, letterTemplates.id);
	}

	async findAllActive(role?: DashboardRole) {
		return db.query.letterTemplates.findMany({
			where: and(
				eq(letterTemplates.isActive, true),
				role ? eq(letterTemplates.role, role) : undefined
			),
			orderBy: letterTemplates.name,
		});
	}
}
