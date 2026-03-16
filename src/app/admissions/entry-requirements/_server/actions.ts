'use server';

import type { entryRequirements } from '@/core/database';
import { createAction } from '@/shared/lib/actions/actionResult';
import type { EntryRequirementFilter } from '../_lib/types';
import { entryRequirementsService } from './service';

type EntryRequirement = typeof entryRequirements.$inferInsert;

export async function getEntryRequirement(id: string) {
	return entryRequirementsService.get(id);
}

export async function findAllEntryRequirements(page = 1, search = '') {
	return entryRequirementsService.findAllWithRelations(page, search);
}

export async function findProgramsWithRequirements(
	page = 1,
	search = '',
	filter?: EntryRequirementFilter
) {
	return entryRequirementsService.findProgramsWithRequirements(
		page,
		search,
		filter
	);
}

export async function findEntryRequirementsByProgram(programId: number) {
	return entryRequirementsService.findByProgram(programId);
}

export async function findEntryRequirementsForEligibility() {
	return entryRequirementsService.findAllForEligibility();
}

export async function getPublicCoursesData(
	page = 1,
	search = '',
	filter?: EntryRequirementFilter
) {
	return entryRequirementsService.findPublicCoursesData(page, search, filter);
}

export const createEntryRequirement = createAction(
	async (data: EntryRequirement) => entryRequirementsService.create(data)
);

export const updateEntryRequirement = createAction(
	async (id: string, data: EntryRequirement) =>
		entryRequirementsService.update(id, data)
);

export const deleteEntryRequirement = createAction(async (id: string) =>
	entryRequirementsService.delete(id)
);
