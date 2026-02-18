import {
	IconCalendarEvent,
	IconClipboardData,
	IconListCheck,
	IconMessageQuestion,
	IconMessageStar,
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
				label: 'Feedback',
				icon: IconMessageStar,
				roles: ['academic', 'admin'],
				collapsed: false,
				isVisible: (session) => {
					const position = session?.user?.position;
					return !!(
						position &&
						['manager', 'admin', 'program_leader'].includes(position)
					);
				},
				children: [
					{
						label: 'Questions',
						href: '/academic/feedback/questions',
						icon: IconMessageQuestion,
						roles: ['academic', 'admin'],
					},
					{
						label: 'Periods',
						href: '/academic/feedback/periods',
						icon: IconCalendarEvent,
						roles: ['academic', 'admin'],
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
