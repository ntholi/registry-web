import {
	IconBarrierBlock,
	IconCertificate,
	IconClipboardCheck,
	IconCopyCheck,
	IconMessageQuestion,
	IconSquareRoundedCheck,
	IconUsersGroup,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import type { UserPosition, UserRole } from '@/db/schema';
import { countByStatus as countGraduationByStatus } from '@/server/registry/graduation/requests/actions';
import { countByStatus } from '@/server/registry/registration/requests/actions';

export const registryConfig: ModuleConfig = {
	id: 'registry-management',
	name: 'Registry Management',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Students',
				href: '/students',
				icon: IconUsersGroup,
				isVisible: (session) => {
					if (
						['registry', 'finance', 'admin', 'student_services'].includes(
							session?.user?.role || ''
						)
					) {
						return true;
					}
					const position = session?.user?.position;
					return !!(
						position &&
						['manager', 'admin', 'program_leader', 'year_leader'].includes(
							position
						)
					);
				},
			},
			{
				label: 'Registration Requests',
				icon: IconClipboardCheck,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Pending',
						href: '/registration/requests/pending',
						icon: IconMessageQuestion,
						notificationCount: {
							queryKey: ['registrationRequests', 'pending'],
							queryFn: () => countByStatus('pending'),
							color: 'red',
						},
					},
					{
						label: 'Registered',
						href: '/registration/requests/registered',
						icon: IconSquareRoundedCheck,
						notificationCount: {
							queryKey: ['registrationRequests', 'registered'],
							queryFn: () => countByStatus('registered'),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registration/requests/rejected',
						icon: IconBarrierBlock,
						notificationCount: {
							queryKey: ['registrationRequests', 'rejected'],
							queryFn: () => countByStatus('rejected'),
							color: 'gray',
						},
					},
					{
						label: 'Approved',
						href: '/registration/requests/approved',
						icon: IconSquareRoundedCheck,
						notificationCount: {
							queryKey: ['registrationRequests', 'approved'],
							queryFn: () => countByStatus('approved'),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Graduation Requests',
				icon: IconCertificate,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Pending',
						href: '/graduation/requests/pending',
						icon: IconMessageQuestion,
						notificationCount: {
							queryKey: ['graduationRequests', 'pending'],
							queryFn: () => countGraduationByStatus('pending'),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/graduation/requests/approved',
						icon: IconSquareRoundedCheck,
						notificationCount: {
							queryKey: ['graduationRequests', 'approved'],
							queryFn: () => countGraduationByStatus('approved'),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/graduation/requests/rejected',
						icon: IconBarrierBlock,
						notificationCount: {
							queryKey: ['graduationRequests', 'rejected'],
							queryFn: () => countGraduationByStatus('rejected'),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Board of Examination',
				href: '/reports/boe',
				description: 'Board of Examination',
				icon: IconCopyCheck,
				roles: ['academic', 'registry', 'admin'],
				isVisible: (session) => {
					if (['admin', 'registry'].includes(session?.user?.role as UserRole))
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
			{
				label: 'Student Registration',
				href: '/reports/registration',
				description: 'Student Registration',
				icon: IconCopyCheck,
				roles: ['academic', 'registry', 'admin', 'finance'],
				isVisible: (session) => {
					if (
						['admin', 'registry', 'finance'].includes(
							session?.user?.role as UserRole
						)
					)
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
		],
	},

	flags: {
		enabled: true,
		beta: false,
	},
};
