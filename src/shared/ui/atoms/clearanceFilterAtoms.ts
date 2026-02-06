import type { ProgramLevel } from '@academic/_database';
import { atomWithStorage } from 'jotai/utils';

export interface ClearanceFilter {
	termId?: number;
	schoolId?: number;
	programId?: number;
	programLevel?: ProgramLevel;
	semester?: string;
}

export const defaultClearanceFilter: ClearanceFilter = {};

export const clearanceFilterAtom = atomWithStorage<ClearanceFilter>(
	'clearance-filter',
	defaultClearanceFilter
);
