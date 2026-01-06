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

export function getGraduationStatus(graduation: {
	informationConfirmed: boolean;
	graduationClearances?: { clearance: { status: BaseStatus } }[];
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
