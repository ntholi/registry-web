import { atomWithStorage } from 'jotai/utils';

export const selectedGraduationDateAtom = atomWithStorage<number | null>(
	'graduation-date',
	null
);
