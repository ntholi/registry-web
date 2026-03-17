import {
	IconCalendarEvent,
	IconClipboardData,
	IconListCheck,
	IconPresentation,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

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
				permissions: [{ resource: 'lecturers', action: 'read' }],
			},
			{
				label: 'Assessments',
				href: '/academic/assessments',
				icon: IconListCheck,
				roles: ['academic'],
				permissions: [{ resource: 'assessments', action: 'read' }],
			},
			{
				label: 'Attendance',
				href: '/academic/attendance',
				icon: IconCalendarEvent,
				roles: ['academic'],
				permissions: [{ resource: 'attendance', action: 'read' }],
			},
			{
				label: 'Gradebook',
				icon: IconClipboardData,
				roles: ['academic'],
				collapsed: false,
				children: [],
				permissions: [{ resource: 'gradebook', action: 'read' }],
			},
		],
	},

	flags: {
		enabled: moduleConfig.academic,
		beta: false,
	},
};
