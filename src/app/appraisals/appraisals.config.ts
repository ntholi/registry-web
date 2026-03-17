import {
	IconCalendarEvent,
	IconChartBar,
	IconMessageQuestion,
	IconMessageStar,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const appraisalsConfig: ModuleConfig = {
	id: 'appraisals',
	name: 'Appraisals',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Student Feedback',
				icon: IconMessageStar,
				roles: ['academic', 'admin', 'human_resource'],
				collapsed: false,
				children: [
					{
						label: 'Questions',
						href: '/appraisals/student-feedback/questions',
						icon: IconMessageQuestion,
						permissions: [
							{ resource: 'student-feedback-questions', action: 'read' },
						],
					},
					{
						label: 'Cycles',
						href: '/appraisals/student-feedback/cycles',
						icon: IconCalendarEvent,
						permissions: [
							{ resource: 'student-feedback-cycles', action: 'read' },
						],
					},
					{
						label: 'Reports',
						href: '/appraisals/student-feedback/reports',
						icon: IconChartBar,
						permissions: [
							{ resource: 'student-feedback-reports', action: 'read' },
						],
					},
				],
			},
		],
	},

	flags: {
		enabled: moduleConfig.appraisals,
		beta: false,
	},
};
