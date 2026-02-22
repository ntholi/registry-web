import {
	IconGavel,
	IconReportAnalytics,
	IconSchool,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '@/core/database';

export const reportsConfig: ModuleConfig = {
	id: 'reports',
	name: 'Reports',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Course Summary',
				href: '/reports/academic/course-summary',
				icon: IconReportAnalytics,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Attendance Report',
				href: '/reports/academic/attendance',
				icon: IconReportAnalytics,
				isVisible: (session) => {
					if (
						['admin', 'registry', 'finance', 'student_services'].includes(
							session?.user?.role as UserRole
						)
					)
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader', 'year_leader'].includes(
							academicRole
						)
					);
				},
			},
			{
				label: 'Board of Examination',
				href: '/reports/academic/boe',
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
				href: '/reports/registry/student-enrollments',
				icon: IconReportAnalytics,
				isVisible: (session) => {
					if (
						['admin', 'registry', 'finance', 'leap'].includes(
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
				href: '/reports/registry/graduations',
				icon: IconSchool,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Sponsored Students',
				href: '/reports/finance/sponsored-students',
				icon: IconReportAnalytics,
				roles: ['finance', 'registry', 'admin'],
			},
		],
	},

	flags: {
		enabled: moduleConfig.reports,
		beta: false,
	},
};
