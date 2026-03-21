import type { Session } from '@/core/auth';
import { hasPermission } from '@/core/auth/sessionPermissions';
import type { StudentStatusApprovalRole } from './types';

interface ApprovalSubject {
	role?: string | null;
	presetName?: string | null;
	permissions?: Session['permissions'];
}

export const APPROVAL_PRESET_ROLES: Record<
	string,
	StudentStatusApprovalRole[]
> = {
	'Academic Manager': ['program_leader'],
	'Program Leader': ['program_leader'],
	'Year Leader': ['year_leader'],
	'Student Services Staff': ['student_services'],
	'Finance Staff': ['finance'],
	'Finance Manager': ['finance'],
};

export const APPROVAL_USER_ROLES: Partial<
	Record<string, StudentStatusApprovalRole[]>
> = {
	finance: ['finance'],
	student_services: ['student_services'],
};

export function canUserApproveRole(
	session: Session,
	approverRole: StudentStatusApprovalRole
) {
	return hasApprovalRole(session, approverRole);
}

export function getUserApprovalRoles(
	session: Session
): StudentStatusApprovalRole[] {
	return getApprovalRolesByUser(session);
}

export function hasApprovalRole(
	subject: ApprovalSubject | Session | null | undefined,
	approverRole: StudentStatusApprovalRole
) {
	return getApprovalRolesByUser(subject).includes(approverRole);
}

export function getApprovalRolesByUser(
	subject: ApprovalSubject | Session | null | undefined
): StudentStatusApprovalRole[] {
	const roles: StudentStatusApprovalRole[] = [];
	const user = normalizeApprovalSubject(subject);

	if (!user?.role || !hasPermission(user, 'student-statuses', 'approve')) {
		return roles;
	}

	const presetRoles = user.presetName
		? (APPROVAL_PRESET_ROLES[user.presetName] ?? [])
		: [];
	const userRoles = user.role ? (APPROVAL_USER_ROLES[user.role] ?? []) : [];

	for (const role of [...presetRoles, ...userRoles]) {
		if (!roles.includes(role)) {
			roles.push(role);
		}
	}

	return roles;
}

function normalizeApprovalSubject(
	subject: ApprovalSubject | Session | null | undefined
): ApprovalSubject | undefined {
	if (!subject) {
		return undefined;
	}

	if ('user' in subject) {
		return {
			role: subject.user.role,
			presetName: subject.user.presetName,
			permissions: subject.permissions,
		};
	}

	return subject;
}
