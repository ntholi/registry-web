'use server';

import { getModules } from '@academic/modules/_server/actions';
import {
	findAllSchools,
	searchPrograms,
} from '@academic/schools/_server/actions';
import { findAllUsers } from '@admin/users/_server/actions';
import { findAllApplicants } from '@admissions/applicants/_server/actions';
import { findAllSponsors } from '@finance/sponsors/_server/actions';
import { findAllEmployees } from '@human-resource/employees/_server/actions';
import { getBooks } from '@library/books/_server/actions';
import { getBlockedStudentByStatus } from '@registry/blocked-students/_server/actions';
import { findAllRegistrationRequests } from '@registry/registration/requests/_server/requests/actions';
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
