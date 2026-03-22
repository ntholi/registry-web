import {
	IconCalendarEvent,
	IconChartBar,
	IconChecklist,
	IconClipboardCheck,
	IconClipboardData,
	IconEye,
	IconInbox,
	IconListCheck,
	IconMail,
	IconMessageQuestion,
	IconMessageStar,
	IconSend,
	IconUserCheck,
	IconUserShield,
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
		collapsed: true,
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
		label: 'Users',
		href: '/admin/users',
		icon: IconUserShield,
		permissions: [{ resource: 'users', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Mail',
		icon: IconMail,
		collapsed: true,
		children: [
			{
				label: 'Inbox',
				href: '/mail/inbox',
				icon: IconInbox,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Accounts',
				href: '/mail/accounts',
				icon: IconUserCheck,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
			{
				label: 'Sent',
				href: '/mail/sent',
				icon: IconSend,
				permissions: [{ resource: 'mails', action: 'read' }],
			},
		],
	},
];
