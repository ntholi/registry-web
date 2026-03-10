interface SessionUserLike {
	role?: string | null;
	position?: string | null;
}

const registrationRequestReadRoles = [
	'admin',
	'registry',
	'leap',
	'student_services',
] as const;

const academicReadPositions = [
	'manager',
	'program_leader',
	'year_leader',
] as const;

export function canReadRegistrationRequestList(
	user: SessionUserLike | undefined
) {
	if (!user?.role) {
		return false;
	}

	if (registrationRequestReadRoles.some((role) => role === user.role)) {
		return true;
	}

	return (
		user.role === 'academic' &&
		academicReadPositions.some((position) => position === user.position)
	);
}
