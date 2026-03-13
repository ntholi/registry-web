import {
	IconGavel,
	IconReportAnalytics,
	IconSchool,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

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
				permissions: [{ resource: 'reports-course-summary', action: 'read' }],
			},
			{
				label: 'Attendance Report',
				href: '/reports/academic/attendance',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-attendance', action: 'read' }],
			},
			{
				label: 'Board of Examination',
				href: '/reports/academic/boe',
				icon: IconGavel,
				permissions: [{ resource: 'reports-boe', action: 'read' }],
			},
			{
				label: 'Student Enrollments',
				href: '/reports/registry/student-enrollments',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-enrollments', action: 'read' }],
			},
			{
				label: 'Graduation Reports',
				href: '/reports/registry/graduations',
				icon: IconSchool,
				permissions: [{ resource: 'reports-graduation', action: 'read' }],
			},
			{
				label: 'Sponsored Students',
				href: '/reports/finance/sponsored-students',
				icon: IconReportAnalytics,
				permissions: [
					{ resource: 'reports-sponsored-students', action: 'read' },
				],
			},
		],
	},

	flags: {
		enabled: moduleConfig.reports,
		beta: false,
	},
};
