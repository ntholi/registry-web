import {
	IconCalendarEvent,
	IconChartBar,
	IconClipboardCheck,
	IconEye,
	IconListCheck,
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
				label: 'Cycles',
				href: '/appraisals/cycles',
				icon: IconCalendarEvent,
				roles: ['academic', 'admin', 'human_resource'],
				permissions: [{ resource: 'feedback-cycles', action: 'read' }],
			},
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
						label: 'Reports',
						href: '/appraisals/student-feedback/reports',
						icon: IconChartBar,
						permissions: [
							{ resource: 'student-feedback-reports', action: 'read' },
						],
					},
				],
			},
			{
				label: 'Teaching Observation',
				icon: IconEye,
				roles: ['academic', 'admin', 'human_resource'],
				collapsed: false,
				children: [
					{
						label: 'Criteria',
						href: '/appraisals/observation-criteria',
						icon: IconListCheck,
						permissions: [
							{ resource: 'teaching-observation-criteria', action: 'read' },
						],
					},
					{
						label: 'Observations',
						href: '/appraisals/teaching-observations',
						icon: IconClipboardCheck,
						permissions: [
							{ resource: 'teaching-observations', action: 'read' },
						],
					},

					{
						label: 'Reports',
						href: '/appraisals/observation-reports',
						icon: IconChartBar,
						permissions: [
							{ resource: 'teaching-observation-reports', action: 'read' },
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
