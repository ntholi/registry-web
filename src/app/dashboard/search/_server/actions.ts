'use server';

import { getModules } from '@academic/modules/_server/actions';
import {
	findAllSchools,
	searchPrograms,
} from '@academic/schools/_server/actions';
import { findAllTasks } from '@admin/tasks';
import { findAllUsers } from '@admin/users/_server/actions';
import { findAllApplicants } from '@admissions/applicants/_server/actions';
import { getBankDeposits } from '@admissions/payments';
import { findAllSponsors } from '@finance/sponsors/_server/actions';
import { findAllEmployees } from '@human-resource/employees/_server/actions';
import { getBooks } from '@library/books/_server/actions';
import { getBlockedStudentByStatus } from '@registry/blocked-students/_server/actions';
import { findAllAutoApprovals } from '@registry/clearance/auto-approve';
import { graduationClearanceByStatus } from '@registry/graduation/clearance';
import { clearanceByStatus } from '@registry/registration/requests';
import { findAllRegistrationRequests } from '@registry/registration/requests/_server/requests/actions';
import { findAllStudentStatuses } from '@registry/student-statuses';
import { findAllStudents } from '@registry/students/_server/actions';
import { findAllVenues } from '@timetable/venues/_server/actions';
import {
	DASHBOARD_ROLES,
	type DashboardRole,
	hasPermission,
	type PermissionRequirement,
} from '@/core/auth/permissions';
import {
	getSessionPermissions,
	type SessionPermissionResult,
} from '@/core/platform/withPermission';

type SearchResultItem = {
	id: string;
	label: string;
	description: string;
	href: string;
};

export type SearchResultGroup = {
	category: string;
	iconName: string;
	items: SearchResultItem[];
};

type EntityConfig = {
	category: string;
	iconName: string;
	check: (session: SessionPermissionResult) => boolean;
	fetch: (query: string) => Promise<SearchResultItem[]>;
};

const MAX = 5;

function cap(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function isDashboard(s: SessionPermissionResult): boolean {
	return DASHBOARD_ROLES.includes(s.session.user.role as DashboardRole);
}

function hasPerm(
	s: SessionPermissionResult,
	req: PermissionRequirement
): boolean {
	if (s.session.user.role === 'admin') return true;
	return hasPermission(s.permissions, req);
}

function hasRole(s: SessionPermissionResult, ...roles: string[]): boolean {
	const r = s.session.user.role;
	return r === 'admin' || roles.includes(r);
}

const entities: EntityConfig[] = [
	{
		category: 'Students',
		iconName: 'IconUser',
		check: (s) => hasPerm(s, { students: ['read'] }),
		async fetch(query) {
			const { items } = await findAllStudents(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `student-${it.stdNo}`,
				label: it.name,
				description: String(it.stdNo),
				href: `/registry/students/${it.stdNo}`,
			}));
		},
	},
	{
		category: 'Users',
		iconName: 'IconUsers',
		check: (s) => hasPerm(s, { users: ['read'] }),
		async fetch(query) {
			const { items } = await findAllUsers(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `user-${it.id}`,
				label: it.name ?? it.email,
				description: it.email,
				href: `/admin/users/${it.id}`,
			}));
		},
	},
	{
		category: 'Modules',
		iconName: 'IconBook',
		check: (s) => isDashboard(s),
		async fetch(query) {
			const { items } = await getModules(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `module-${it.id}`,
				label: it.name,
				description: it.code,
				href: `/academic/modules/${it.id}`,
			}));
		},
	},
	{
		category: 'Schools',
		iconName: 'IconSchool',
		check: (s) => isDashboard(s),
		async fetch(query) {
			const { items } = await findAllSchools(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `school-${it.id}`,
				label: it.name,
				description: it.code,
				href: `/academic/schools/${it.id}`,
			}));
		},
	},
	{
		category: 'Programs',
		iconName: 'IconCertificate',
		check: (s) => isDashboard(s),
		async fetch(query) {
			const items = await searchPrograms(query, MAX);
			return items.map((it) => ({
				id: `program-${it.id}`,
				label: it.name,
				description: it.code,
				href: `/academic/schools/programs/${it.id}`,
			}));
		},
	},
	{
		category: 'Applicants',
		iconName: 'IconUserSearch',
		check: (s) => hasPerm(s, { applicants: ['read'] }),
		async fetch(query) {
			const { items } = await findAllApplicants(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `applicant-${it.id}`,
				label: it.fullName,
				description: it.nationalId ?? '',
				href: `/admissions/applicants/${it.id}`,
			}));
		},
	},
	{
		category: 'Employees',
		iconName: 'IconBriefcase',
		check: (s) => hasPerm(s, { employees: ['read'] }),
		async fetch(query) {
			const { items } = await findAllEmployees(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `employee-${it.empNo}`,
				label: it.name,
				description: it.empNo,
				href: `/human-resource/employees/${it.empNo}`,
			}));
		},
	},
	{
		category: 'Books',
		iconName: 'IconBookUpload',
		check: (s) => hasPerm(s, { library: ['read'] }),
		async fetch(query) {
			const { items } = await getBooks(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `book-${it.id}`,
				label: it.title,
				description: it.isbn ?? '',
				href: `/library/books/${it.id}`,
			}));
		},
	},
	{
		category: 'Sponsors',
		iconName: 'IconCoin',
		check: (s) => hasPerm(s, { sponsors: ['read'] }),
		async fetch(query) {
			const { items } = await findAllSponsors(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `sponsor-${it.id}`,
				label: it.name,
				description: it.code ?? '',
				href: `/finance/sponsors/${it.id}`,
			}));
		},
	},
	{
		category: 'Blocked Students',
		iconName: 'IconLock',
		check: (s) => hasRole(s, 'finance', 'registry'),
		async fetch(query) {
			const { items } = await getBlockedStudentByStatus('blocked', 1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `blocked-${it.id}`,
				label: String(it.stdNo),
				description: it.reason ?? '',
				href: `/registry/blocked-students/${it.id}`,
			}));
		},
	},
	{
		category: 'Registration Requests',
		iconName: 'IconFileCheck',
		check: (s) => hasPerm(s, { registration: ['read'] }),
		async fetch(query) {
			const result = await findAllRegistrationRequests(1, query);
			return result.data.slice(0, MAX).map((it) => ({
				id: `request-${it.id}`,
				label: `Request #${it.id}`,
				description: String(it.stdNo),
				href: `/registry/registration/requests/${it.id}`,
			}));
		},
	},
	{
		category: 'Venues',
		iconName: 'IconBuildingArch',
		check: (s) => isDashboard(s),
		async fetch(query) {
			const { items } = await findAllVenues(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `venue-${it.id}`,
				label: it.name,
				description: it.capacity ? `Capacity: ${it.capacity}` : '',
				href: `/timetable/venues/${it.id}`,
			}));
		},
	},
	{
		category: 'Reg. Clearance',
		iconName: 'IconClipboardCheck',
		check: (s) => hasPerm(s, { 'registration-clearance': ['read'] }),
		async fetch(query) {
			const { items } = await clearanceByStatus(undefined, 1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `reg-clearance-${it.id}`,
				label:
					it.registrationRequest.student?.name ??
					String(it.registrationRequest.stdNo),
				description: `${it.registrationRequest.stdNo} • ${cap(it.status)}`,
				href: `/registry/registration/requests/${it.registrationRequest.id}`,
			}));
		},
	},
	{
		category: 'Grad. Clearance',
		iconName: 'IconAward',
		check: (s) => hasPerm(s, { 'graduation-clearance': ['read'] }),
		async fetch(query) {
			const { items } = await graduationClearanceByStatus(undefined, 1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `grad-clearance-${it.id}`,
				label: it.graduationRequest?.studentProgram?.student?.name ?? 'Unknown',
				description: `${
					it.graduationRequest?.studentProgram?.student?.stdNo ?? ''
				} • ${cap(it.status)}`,
				href: `/registry/graduation/clearance/${it.id}`,
			}));
		},
	},
	{
		category: 'Student Statuses',
		iconName: 'IconUserExclamation',
		check: (s) => hasPerm(s, { 'student-statuses': ['read'] }),
		async fetch(query) {
			const { items } = await findAllStudentStatuses(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `student-status-${it.id}`,
				label: it.student?.name ?? String(it.stdNo),
				description: `${it.stdNo} • ${cap(it.type)} • ${cap(it.status)}`,
				href: `/registry/student-statuses/${it.id}`,
			}));
		},
	},
	{
		category: 'Adm. Payments',
		iconName: 'IconCreditCard',
		check: (s) => hasPerm(s, { 'admissions-payments': ['read'] }),
		async fetch(query) {
			const { items } = await getBankDeposits(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `payment-${it.id}`,
				label: it.applicantName ?? 'Unknown',
				description: `M ${it.amountDeposited} • ${cap(it.status)}`,
				href: `/admissions/payments/${it.id}`,
			}));
		},
	},
	{
		category: 'Auto Approvals',
		iconName: 'IconRobot',
		check: (s) => hasPerm(s, { 'auto-approvals': ['read'] }),
		async fetch(query) {
			const { items } = await findAllAutoApprovals(1, query);
			return items.slice(0, MAX).map((it) => ({
				id: `auto-approval-${it.id}`,
				label: it.student?.name ?? String(it.stdNo),
				description: `${it.stdNo} • ${it.department}${
					it.term ? ` • ${it.term.code}` : ''
				}`,
				href: `/registry/clearance/auto-approve/${it.id}`,
			}));
		},
	},
	{
		category: 'Tasks',
		iconName: 'IconChecklist',
		check: (s) => isDashboard(s),
		async fetch(query) {
			const { items } = await findAllTasks(1, query, 'all');
			return items.slice(0, MAX).map((it) => ({
				id: `task-${it.id}`,
				label: it.title,
				description: cap(it.status.replaceAll('_', ' ')),
				href: `/admin/tasks/${it.id}`,
			}));
		},
	},
];

export async function universalSearch(
	query: string
): Promise<SearchResultGroup[]> {
	if (!query || query.length < 3) return [];

	const sess = await getSessionPermissions();
	if (!sess) return [];

	const allowed = entities.filter((e) => e.check(sess));

	const results = await Promise.allSettled(
		allowed.map(async (e) => ({
			category: e.category,
			iconName: e.iconName,
			items: await e.fetch(query),
		}))
	);

	return results
		.filter(
			(r): r is PromiseFulfilledResult<SearchResultGroup> =>
				r.status === 'fulfilled' && r.value.items.length > 0
		)
		.map((r) => r.value);
}
