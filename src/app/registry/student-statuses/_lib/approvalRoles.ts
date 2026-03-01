import type { Session } from 'next-auth';
import type { StudentStatusApprovalRole } from './types';

interface SessionUserLike {
	role?: string | null;
	position?: string | null;
}

export function canUserApproveRole(
	session: Session,
	approverRole: StudentStatusApprovalRole
) {
	return hasApprovalRole(session.user, approverRole);
}

export function getUserApprovalRoles(
	session: Session
): StudentStatusApprovalRole[] {
	return getApprovalRolesByUser(session.user);
}

export function hasApprovalRole(
	user: SessionUserLike | undefined,
	approverRole: StudentStatusApprovalRole
) {
	if (!user?.role) {
		return false;
	}

	switch (approverRole) {
		case 'year_leader':
			return user.role === 'academic' && user.position === 'year_leader';
		case 'program_leader':
			return (
				user.role === 'academic' &&
				(user.position === 'manager' || user.position === 'program_leader')
			);
		case 'student_services':
			return user.role === 'student_services';
		case 'finance':
			return user.role === 'finance';
	}
}

export function getApprovalRolesByUser(
	user: SessionUserLike | undefined
): StudentStatusApprovalRole[] {
	const roles: StudentStatusApprovalRole[] = [];
	if (!user?.role) {
		return roles;
	}

	if (user.role === 'academic') {
		if (user.position === 'year_leader') {
			roles.push('year_leader');
		}
		if (user.position === 'manager' || user.position === 'program_leader') {
			roles.push('program_leader');
		}
	}
	if (user.role === 'student_services') {
		roles.push('student_services');
	}
	if (user.role === 'finance') {
		roles.push('finance');
	}

	return roles;
}
