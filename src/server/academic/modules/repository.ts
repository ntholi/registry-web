import { eq } from 'drizzle-orm';
import BaseRepository from '@/server/base/BaseRepository';
import { db } from '@/shared/db';
import { modules } from '@/shared/db/schema';

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
