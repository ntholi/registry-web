import {
	IconCalendarEvent,
	IconChartBar,
	IconChecklist,
	IconClipboardCheck,
	IconClipboardData,
	IconEye,
	IconListCheck,
	IconMessageQuestion,
	IconMessageStar,
	IconUsers,
} from '@tabler/icons-react';
import type { NavItem } from '../types';

export const humanResourceNav: NavItem[] = [
	{
		label: 'Employees',
		href: '/human-resource/employees',
		icon: IconUsers,
		permissions: [{ resource: 'employees', action: 'read' }],
	},
	{
		label: 'Appraisals',
		icon: IconClipboardData,
		collapsed: false,
		children: [
			{
				label: 'Cycles',
				href: '/appraisals/cycles',
				icon: IconCalendarEvent,
				permissions: [{ resource: 'feedback-cycles', action: 'read' }],
			},
			{
				label: 'Reports',
				href: '/appraisals/reports',
				icon: IconChartBar,
				permissions: [
					{ resource: 'student-feedback-reports', action: 'read' },
					{ resource: 'teaching-observation-reports', action: 'read' },
				],
			},
			{
				label: 'Student Feedback',
				icon: IconMessageStar,
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
				],
			},
			{
				label: 'Teaching Observation',
				icon: IconEye,
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
				],
			},
		],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
];
