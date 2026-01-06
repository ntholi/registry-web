import {
	IconCalendarEvent,
	IconClipboardData,
	IconListCheck,
	IconPresentation,
	IconReportAnalytics,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '../auth/_database';

export const academicConfig: ModuleConfig = {
	id: 'academic',
	name: 'Academic',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Lecturers',
				href: '/academic/lecturers',
				roles: ['academic'],
				icon: IconPresentation,
				isVisible: (session) => {
					const position = session?.user?.position;
					return !!(
						position &&
						['manager', 'admin', 'program_leader'].includes(position)
					);
				},
			},
			{
				label: 'Assessments',
				href: '/academic/assessments',
				icon: IconListCheck,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Attendance',
				href: '/academic/attendance',
				icon: IconCalendarEvent,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Gradebook',
				icon: IconClipboardData,
				roles: ['academic'],
				collapsed: false,
				children: [],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Course Summary',
				href: '/academic/reports/course-summary',
				icon: IconReportAnalytics,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Attendance Report',
				href: '/academic/reports/attendance',
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
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
		],
	},

	flags: {
		enabled: moduleConfig.academic,
		beta: false,
	},
};
