import {
	IconCalendarDue,
	IconCalendarEvent,
	IconCertificate,
	IconGavel,
	IconReportAnalytics,
	IconSchool,
	IconUserOff,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '@/core/database';

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
				label: 'Board of Examination',
				href: '/academic/reports/boe',
				icon: IconGavel,
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
				label: 'Student Enrollments',
				href: '/registry/reports/student-enrollments',
				icon: IconReportAnalytics,
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
			{
				label: 'Graduation Reports',
				href: '/registry/reports/graduations',
				icon: IconSchool,
				roles: ['registry', 'admin'],
			},
		],
	},

	flags: {
		enabled: moduleConfig.registry,
		beta: false,
	},
};
