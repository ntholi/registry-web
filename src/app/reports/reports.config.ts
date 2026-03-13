import {
	IconGavel,
	IconReportAnalytics,
	IconSchool,
} from '@tabler/icons-react';
import type { Session } from 'next-auth';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { PermissionGrant, Resource } from '@/core/auth/permissions';

type SessionWithPermissions = Session & {
	permissions?: PermissionGrant[];
};

function hasReadPermission(
	session: Session | null,
	resource: Resource
): boolean {
	if (session?.user?.role === 'admin') {
		return true;
	}

	const permissions = (session as SessionWithPermissions | null)?.permissions;
	if (!Array.isArray(permissions)) {
		return false;
	}

	return permissions.some(
		(permission) =>
			permission.resource === resource && permission.action === 'read'
	);
}

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
				isVisible: (session) =>
					hasReadPermission(session, 'reports-course-summary'),
			},
			{
				label: 'Attendance Report',
				href: '/reports/academic/attendance',
				icon: IconReportAnalytics,
				isVisible: (session) =>
					hasReadPermission(session, 'reports-attendance'),
			},
			{
				label: 'Board of Examination',
				href: '/reports/academic/boe',
				icon: IconGavel,
				isVisible: (session) => hasReadPermission(session, 'reports-boe'),
			},
			{
				label: 'Student Enrollments',
				href: '/reports/registry/student-enrollments',
				icon: IconReportAnalytics,
				isVisible: (session) =>
					hasReadPermission(session, 'reports-enrollments'),
			},
			{
				label: 'Graduation Reports',
				href: '/reports/registry/graduations',
				icon: IconSchool,
				isVisible: (session) =>
					hasReadPermission(session, 'reports-graduation'),
			},
			{
				label: 'Sponsored Students',
				href: '/reports/finance/sponsored-students',
				icon: IconReportAnalytics,
				isVisible: (session) =>
					hasReadPermission(session, 'reports-sponsored-students'),
			},
		],
	},

	flags: {
		enabled: moduleConfig.reports,
		beta: false,
	},
};
