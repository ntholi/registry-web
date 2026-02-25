import {
	IconBook,
	IconBooks,
	IconCalendarDue,
	IconCalendarEvent,
	IconCertificate,
	IconClipboardCheck,
	IconRobot,
	IconSchool,
	IconUserOff,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '../auth/_database';
import { countPendingGraduationClearances } from './graduation';
import { countPendingClearances } from './registration';

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
							'leap',
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
				href: '/registry/registration/clearance',
				icon: IconClipboardCheck,
				roles: ['finance', 'library', 'resource', 'leap'],
				notificationCount: {
					queryKey: ['clearances', 'pending'],
					queryFn: () => countPendingClearances(),
					color: 'red',
				},
			},
			{
				label: 'Auto-Approvals',
				href: '/registry/clearance/auto-approve',
				icon: IconRobot,
				roles: ['finance', 'library', 'resource', 'admin'],
			},
			{
				label: 'Graduation Clearance',
				href: '/registry/graduation/clearance',
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
				notificationCount: {
					queryKey: ['graduation-clearances', 'pending'],
					queryFn: () => countPendingGraduationClearances(),
					color: 'red',
				},
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
