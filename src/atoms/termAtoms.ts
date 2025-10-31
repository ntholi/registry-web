import { atom } from 'jotai';

export type Term = {
	id: number;
	name: string;
	isActive: boolean;
};

export const selectedTermAtom = atom<number | null>(null);
