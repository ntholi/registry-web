export type BaseStatus = 'pending' | 'approved' | 'rejected' | 'confirmed';
export type RegistrationStatus = BaseStatus | 'partial' | 'registered';

export function getClearanceStatus<T extends { clearance: { status: string } }>(
	clearances: T[] | undefined
) {
	if (!clearances || clearances.length === 0) {
		return 'pending';
	}

	const anyRejected = clearances.some((c) => c.clearance.status === 'rejected');
	if (anyRejected) return 'rejected';

	const allApproved = clearances.every(
		(c) => c.clearance.status === 'approved'
	);
	if (allApproved) return 'approved';

	return 'pending';
}

export function getRegistrationOverallClearanceStatus(registration: {
	clearances: { clearance: { status: RegistrationStatus } }[];
	status: RegistrationStatus;
}) {
	const baseStatus = getClearanceStatus(registration.clearances);
	if (baseStatus === 'approved' && registration.status === 'registered') {
		return 'registered';
	}
	if (baseStatus === 'pending' && registration.status === 'partial') {
		return 'partial';
	}

	return baseStatus as RegistrationStatus;
}
