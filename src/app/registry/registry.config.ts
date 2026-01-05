import { countByStatus as countGraduationByStatus } from '@registry/graduation/clearance';
import { countByStatus } from '@registry/registration';
import {
	IconCalendarDue,
	IconCalendarEvent,
	IconCalendarMonth,
	IconCertificate,
	IconGavel,
	IconReportAnalytics,
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
				label: 'Registration Requests',
				href: '/registry/registration/requests',
				icon: IconUserPlus,
				roles: ['registry', 'admin'],
				notificationCount: {
					queryKey: ['registration-requests', 'pending'],
					queryFn: () => countByStatus('pending'),
					color: 'red',
				},
			},
			{
				label: 'Graduation Requests',
				href: '/registry/graduation/requests',
				icon: IconCertificate,
				roles: ['registry', 'admin'],
				notificationCount: {
					queryKey: ['graduation-requests', 'pending'],
					queryFn: () => countGraduationByStatus('pending'),
					color: 'red',
				},
			},
			{
				label: 'Dates',
				icon: IconCalendarMonth,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Terms',
						href: '/registry/dates/terms',
						icon: IconCalendarDue,
						roles: ['admin', 'registry'],
					},
					{
						label: 'Graduations',
						href: '/registry/dates/graduations',
						icon: IconCalendarEvent,
						roles: ['admin', 'registry'],
					},
				],
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
		],
	},

	flags: {
		enabled: moduleConfig.registry,
		beta: false,
	},
};
