'use server';

import { auth } from '@/core/auth';
import type { observations } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { ObservationFormValues } from '../_lib/types';
import { observationService as service } from './service';

export type ObservationDetailData = NonNullable<
	Awaited<ReturnType<typeof service.findObservation>>
>;

export async function getObservations(page = 1, search = '') {
	return service.queryObservations({
		page,
		search: search.trim(),
	});
}

export async function getObservation(id: string) {
	return service.findObservation(id);
}

export const createObservation = createAction(
	async (values: ObservationFormValues) => {
		const session = await auth();
		if (!session?.user?.id) throw new Error('Not authenticated');

		const data: typeof observations.$inferInsert = {
			cycleId: values.cycleId,
			assignedModuleId: values.assignedModuleId,
			observerId: session.user.id,
			strengths: values.strengths,
			improvements: values.improvements,
			recommendations: values.recommendations,
			trainingArea: values.trainingArea,
		};

		const criterionIds = values.ratings.map((r) => r.criterionId);
		const obs = await service.createWithRatings(data, criterionIds);

		const ratingsWithValues = values.ratings.filter((r) => r.rating != null);
		if (ratingsWithValues.length > 0) {
			await service.updateWithRatings(obs.id, {}, ratingsWithValues);
		}

		return obs;
	}
);

export const updateObservation = createAction(
	async (id: string, values: ObservationFormValues) => {
		const data: Partial<typeof observations.$inferInsert> = {
			strengths: values.strengths,
			improvements: values.improvements,
			recommendations: values.recommendations,
			trainingArea: values.trainingArea,
		};
		return service.updateWithRatings(id, data, values.ratings);
	}
);

export const submitObservation = createAction(async (id: string) =>
	service.submit(id)
);

export const acknowledgeObservation = createAction(
	async (id: string, comment: string | null) => service.acknowledge(id, comment)
);

export const deleteObservation = createAction(async (id: string) =>
	service.delete(id)
);

export async function getMyObservations(page = 1, search = '') {
	const session = await auth();
	if (!session?.user?.id) return { items: [], totalPages: 0, totalItems: 0 };
	return service.findForLecturer(session.user.id, {
		page,
		search: search.trim(),
	});
}

export async function checkObservationExists(
	cycleId: string,
	assignedModuleId: number
) {
	return service.checkExists(cycleId, assignedModuleId);
}

export async function getActiveCycles() {
	return service.getActiveCycles();
}

export async function getLecturersForSchool(termId: number) {
	return service.getLecturersForSchool(termId);
}

export async function getAssignedModules(userId: string, termId: number) {
	return service.getAssignedModulesForLecturer(userId, termId);
}

export async function getAllCriteria() {
	return service.getAllCriteria();
}
