import {
	IconCalendarEvent,
	IconChartBar,
	IconClipboardData,
	IconListCheck,
	IconMessageQuestion,
	IconMessageStar,
	IconPresentation,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import {
	hasAnyPermission,
	hasSessionPermission,
} from '@/core/auth/sessionPermissions';

export const academicConfig: ModuleConfig = {
	id: 'academic',
	name: 'Academic',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Lecturers',
				description: 'Assigned Modules',
				href: '/academic/lecturers',
				roles: ['academic'],
				icon: IconPresentation,
				isVisible: (session) =>
					hasSessionPermission(session, 'lecturers', 'read'),
			},
			{
				label: 'Assessments',
				href: '/academic/assessments',
				icon: IconListCheck,
				roles: ['academic'],
				isVisible: (session) =>
					hasSessionPermission(session, 'assessments', 'read'),
			},
			{
				label: 'Attendance',
				href: '/academic/attendance',
				icon: IconCalendarEvent,
				roles: ['academic'],
				isVisible: (session) =>
					hasSessionPermission(session, 'attendance', 'read'),
			},
			{
				label: 'Gradebook',
				icon: IconClipboardData,
				roles: ['academic'],
				collapsed: false,
				children: [],
				isVisible: (session) =>
					hasAnyPermission(session, 'gradebook', ['read', 'update', 'approve']),
			},
			{
				label: 'Student Feedback',
				icon: IconMessageStar,
				roles: ['academic', 'admin', 'human_resource'],
				collapsed: false,
				children: [
					{
						label: 'Questions',
						href: '/academic/feedback/questions',
						icon: IconMessageQuestion,
						roles: ['academic', 'admin'],
					},
					{
						label: 'Cycles',
						href: '/academic/feedback/cycles',
						icon: IconCalendarEvent,
						roles: ['academic', 'admin'],
					},
					{
						label: 'Reports',
						href: '/academic/feedback/reports',
						icon: IconChartBar,
					},
				],
			},
		],
	},

	flags: {
		enabled: moduleConfig.academic,
		beta: false,
	},
};
