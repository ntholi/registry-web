import { GRADUATION_CLEARANCE_DEPTS } from '@registry/clearance/_lib/constants';
import { getClearanceStatus as getStatus } from '@registry/clearance/_lib/status';

export type BaseStatus = 'pending' | 'approved' | 'rejected' | 'confirmed';
export type RegistrationStatus = BaseStatus | 'partial' | 'registered';

export function getClearanceStatus<
	T extends { clearance: { status: string; department: string } },
>(clearances: T[] | undefined) {
	return getStatus(clearances, GRADUATION_CLEARANCE_DEPTS);
}

export function getGraduationStatus(graduation: {
	informationConfirmed: boolean;
	graduationClearances?: {
		clearance: { status: BaseStatus; department: string };
	}[];
}) {
	const clearanceStatus = graduation.graduationClearances
		? getClearanceStatus(graduation.graduationClearances)
		: 'pending';
	if (clearanceStatus === 'approved' && graduation.informationConfirmed) {
		return 'approved';
	}
	if (clearanceStatus === 'rejected') {
		return 'rejected';
	}
	if (graduation.informationConfirmed && clearanceStatus === 'pending') {
		return 'pending';
	}
	if (!graduation.informationConfirmed) {
		return 'pending';
	}

	return 'pending';
}
