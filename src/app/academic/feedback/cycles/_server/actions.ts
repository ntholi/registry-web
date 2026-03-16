'use server';

import { getAllSchools } from '@academic/schools/_server/actions';
import { getUserSchools } from '@admin/users/_server/actions';
import { getAllTerms } from '@registry/terms/_server/actions';
import type { feedbackCycles } from '@/core/database';
import { createAction, unwrap } from '@/shared/lib/actions/actionResult';
import { feedbackCyclesService as service } from './service';

type Cycle = typeof feedbackCycles.$inferInsert;
type CycleWithSchools = Cycle & { schoolIds?: number[] };

export const getCycles = createAction(async (page = 1, search = '') =>
	service.findAllWithSchoolCodes({
		page,
		search: search.trim(),
		searchColumns: ['name'],
	})
);

export const getCycle = createAction(async (id: string) => service.get(id));

export const createCycle = createAction(async (data: CycleWithSchools) => {
	const { schoolIds = [], ...cycleData } = data;
	return service.createWithSchools(cycleData, schoolIds);
});

export const updateCycle = createAction(
	async (id: string, data: CycleWithSchools) => {
		const { schoolIds = [], ...cycleData } = data;
		return service.updateWithSchools(id, cycleData, schoolIds);
	}
);

export const deleteCycle = createAction(async (id: string) =>
	service.delete(id)
);

export const getClassesForCycle = createAction(
	async (cycleId: string, termId: number) =>
		service.getClassesForCycle(cycleId, termId)
);

export const getPassphraseStats = createAction(async (cycleId: string) =>
	service.getPassphraseStats(cycleId)
);

export const generatePassphrases = createAction(
	async (
		cycleId: string,
		structureSemesterId: number,
		passphraseCount: number
	) =>
		service.generatePassphrases(cycleId, structureSemesterId, passphraseCount)
);

export const getPassphrasesForClass = createAction(
	async (cycleId: string, structureSemesterId: number) =>
		service.getPassphrasesForClass(cycleId, structureSemesterId)
);

export const getTerms = createAction(async () => getAllTerms());

export const getSchools = createAction(async () =>
	unwrap(await getAllSchools())
);

export const getSchoolsForUser = createAction(async (userId?: string) =>
	getUserSchools(userId)
);
