'use server';

import type { entryRequirements } from '@/core/database';
import { createAction } from '@/shared/lib/utils/actionResult';
import type { EntryRequirementFilter } from '../_lib/types';
import { entryRequirementsService } from './service';

type EntryRequirement = typeof entryRequirements.$inferInsert;

export const getEntryRequirement = createAction(async (id: string) => {
	return entryRequirementsService.get(id);
});

export const findAllEntryRequirements = createAction(
	async (page: number = 1, search: string = '') => {
		return entryRequirementsService.findAllWithRelations(page, search);
	}
);

export const findProgramsWithRequirements = createAction(
	async (
		page: number = 1,
		search: string = '',
		filter?: EntryRequirementFilter
	) => {
		return entryRequirementsService.findProgramsWithRequirements(
			page,
			search,
			filter
		);
	}
);

export const findEntryRequirementsByProgram = createAction(
	async (programId: number) => {
		return entryRequirementsService.findByProgram(programId);
	}
);

export const findEntryRequirementsForEligibility = createAction(async () => {
	return entryRequirementsService.findAllForEligibility();
});

export const getPublicCoursesData = createAction(
	async (
		page: number = 1,
		search: string = '',
		filter?: EntryRequirementFilter
	) => {
		return entryRequirementsService.findPublicCoursesData(page, search, filter);
	}
);

export const createEntryRequirement = createAction(
	async (data: EntryRequirement) => {
		return entryRequirementsService.create(data);
	}
);

export const updateEntryRequirement = createAction(
	async (id: string, data: EntryRequirement) => {
		return entryRequirementsService.update(id, data);
	}
);

export const deleteEntryRequirement = createAction(async (id: string) => {
	return entryRequirementsService.delete(id);
});
