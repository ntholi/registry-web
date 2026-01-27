import {
	IconBan,
	IconBook,
	IconBooks,
	IconCalendarDue,
	IconCalendarEvent,
	IconCertificate,
	IconCircleCheck,
	IconClipboardCheck,
	IconHourglass,
	IconRobot,
	IconSchool,
	IconUserOff,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '../auth/_database';
import {
	countApprovedGraduationClearances,
	countPendingGraduationClearances,
	countRejectedGraduationClearances,
} from './graduation';
import {
	countApprovedClearances,
	countPendingClearances,
	countRejectedClearances,
} from './registration';

export const registryConfig: ModuleConfig = {
	id: 'registry',
	name: 'Registry',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Students',
				href: '/registry/students',
				icon: IconUsers,
				isVisible: (session) => {
					if (
						[
							'registry',
							'finance',
							'admin',
							'student_services',
							'marketing',
						].includes(session?.user?.role || '')
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
				label: 'Registration',
				description: 'Registration Requests',
				href: '/registry/registration/requests',
				icon: IconUserPlus,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Graduations',
				icon: IconSchool,
				collapsed: true,
				children: [
					{
						label: 'Requests',
						href: '/registry/graduation/requests',
						icon: IconCertificate,
						roles: ['registry', 'admin'],
					},
					{
						label: 'Dates',
						href: '/registry/graduation/dates',
						icon: IconCalendarEvent,
						roles: ['admin', 'registry'],
					},
				],
			},
			{
				label: 'Registration Clearance',
				icon: IconClipboardCheck,

				children: [
					{
						label: 'Requests',
						href: '/registry/registration/clearance/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['clearances', 'pending'],
							queryFn: () => countPendingClearances(),
							color: 'red',
						},
						roles: ['finance', 'library', 'resource'],
					},
					{
						label: 'Approved',
						href: '/registry/registration/clearance/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['clearances', 'approved'],
							queryFn: () => countApprovedClearances(),
							color: 'gray',
						},
						roles: ['finance', 'library', 'resource'],
					},
					{
						label: 'Rejected',
						href: '/registry/registration/clearance/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['clearances', 'rejected'],
							queryFn: () => countRejectedClearances(),
							color: 'gray',
						},
						roles: ['finance', 'library', 'resource'],
					},
					{
						label: 'Auto-Approvals',
						href: '/registry/registration/clearance/auto-approve',
						icon: IconRobot,
						roles: ['finance', 'library', 'resource', 'admin'],
					},
				] as NavItem[],
			},
			{
				label: 'Graduation Clearance',
				icon: IconCertificate,
				isVisible: (session) => {
					if (['finance', 'library'].includes(session?.user?.role as UserRole))
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
				collapsed: true,
				children: [
					{
						label: 'Requests',
						href: '/registry/graduation/clearance/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['graduation-clearances', 'pending'],
							queryFn: () => countPendingGraduationClearances(),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/registry/graduation/clearance/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['graduation-clearances', 'approved'],
							queryFn: () => countApprovedGraduationClearances(),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registry/graduation/clearance/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['graduation-clearances', 'rejected'],
							queryFn: () => countRejectedGraduationClearances(),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Blocked Students',
				href: '/registry/blocked-students',
				icon: IconUserOff,
				roles: ['admin', 'registry', 'finance'],
			},
			{
				label: 'Terms',
				href: '/registry/terms',
				icon: IconCalendarDue,
				roles: ['admin', 'registry'],
			},

			{
				label: 'Modules',
				href: '/academic/modules',
				icon: IconBook,
				roles: ['admin'],
			},
			{
				label: 'Semester Modules',
				href: '/academic/semester-modules',
				icon: IconBooks,
				roles: ['registry', 'admin', 'academic', 'finance'],
			},

			{
				label: 'Schools',
				href: '/academic/schools',
				icon: IconSchool,
				roles: [
					'registry',
					'admin',
					'academic',
					'finance',
					'student_services',
					'marketing',
				],
			},
		],
	},

	flags: {
		enabled: moduleConfig.registry,
		beta: false,
	},
};
