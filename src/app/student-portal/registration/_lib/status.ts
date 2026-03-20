import { REGISTRATION_CLEARANCE_DEPTS } from '@registry/clearance/_lib/constants';
import { getClearanceStatus as getStatus } from '@registry/clearance/_lib/status';

export type BaseStatus = 'pending' | 'approved' | 'rejected' | 'confirmed';
export type RegistrationStatus = BaseStatus | 'partial' | 'registered';

export function getClearanceStatus<
	T extends { clearance: { status: string; department: string } },
>(clearances: T[] | undefined) {
	return getStatus(clearances, REGISTRATION_CLEARANCE_DEPTS);
}

export function getRegistrationOverallClearanceStatus(registration: {
	clearances: {
		clearance: { status: RegistrationStatus; department: string };
	}[];
	status: RegistrationStatus;
}) {
	const baseStatus = getClearanceStatus(registration.clearances);
	if (baseStatus === 'approved' || registration.status === 'registered') {
		return 'registered';
	}
	if (baseStatus === 'pending' && registration.status === 'partial') {
		return 'partial';
	}

	return baseStatus as RegistrationStatus;
}
