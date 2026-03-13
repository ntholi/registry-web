import {
	IconBook,
	IconBooks,
	IconCalendarDue,
	IconCalendarEvent,
	IconCertificate,
	IconClipboardCheck,
	IconNote,
	IconPrinter,
	IconRobot,
	IconSchool,
	IconUserExclamation,
	IconUserOff,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import { countPendingGraduationClearances } from './graduation';
import { countPendingClearances } from './registration';
import { countPendingStudentStatuses } from './student-statuses';

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
				permissions: [{ resource: 'students', action: 'read' }],
			},
			{
				label: 'Registration',
				description: 'Registration Requests',
				href: '/registry/registration/requests',
				icon: IconUserPlus,
				permissions: [{ resource: 'registration', action: 'read' }],
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
					{
						label: 'Certificate Reprints',
						href: '/registry/certificate-reprints',
						icon: IconPrinter,
						roles: ['registry', 'admin'],
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
				permissions: [{ resource: 'graduation-clearance', action: 'read' }],
				notificationCount: {
					queryKey: ['graduation-clearances', 'pending'],
					queryFn: () => countPendingGraduationClearances(),
					color: 'red',
				},
			},
			{
				label: 'Student Status',
				href: '/registry/student-statuses',
				icon: IconUserExclamation,
				permissions: [{ resource: 'student-statuses', action: 'read' }],
				notificationCount: {
					queryKey: ['student-statuses', 'pending'],
					queryFn: () => countPendingStudentStatuses(),
					color: 'red',
				},
			},
			{
				label: 'Notes',
				href: '/registry/student-notes',
				icon: IconNote,
				roles: ['admin', 'registry', 'finance', 'academic', 'student_services'],
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
