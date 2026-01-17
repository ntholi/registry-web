'use server';

import type { entryRequirements } from '@/core/database';
import type { EntryRequirementFilter } from '../_lib/types';
import { entryRequirementsService } from './service';

type EntryRequirement = typeof entryRequirements.$inferInsert;

export async function getEntryRequirement(id: number) {
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

export async function createEntryRequirement(data: EntryRequirement) {
	return entryRequirementsService.create(data);
}

export async function updateEntryRequirement(
	id: number,
	data: EntryRequirement
) {
	return entryRequirementsService.update(id, data);
}

export async function deleteEntryRequirement(id: number) {
	return entryRequirementsService.delete(id);
}
