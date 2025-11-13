import { eq } from 'drizzle-orm';
import { db } from '@/core/database';
import { modules } from '@/core/database/schema';
import BaseRepository from '@/server/base/BaseRepository';

export default class ModuleRepository extends BaseRepository<
	typeof modules,
	'id'
> {
	constructor() {
		super(modules, modules.id);
	}

	override async findById(id: number) {
		return db.query.modules.findFirst({
			where: eq(modules.id, id),
			with: {
				assessments: true,
			},
		});
	}
}

export const modulesRepository = new ModuleRepository();
