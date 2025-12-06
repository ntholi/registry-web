import { atomWithStorage } from 'jotai/utils';

export type Term = {
	id: number;
	name: string;
	isActive: boolean;
};

export const selectedTermAtom = atomWithStorage<number | null>('term', null);
