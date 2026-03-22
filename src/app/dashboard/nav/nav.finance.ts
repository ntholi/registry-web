import { countPendingPaymentsForReview } from '@admissions/payments/_server/actions';
import { countPendingGraduationClearances } from '@registry/graduation';
import { countPendingClearances } from '@registry/registration';
import { countPendingStudentStatuses } from '@registry/student-statuses';
import {
	IconBuildingBank,
	IconCertificate,
	IconChecklist,
	IconClipboardCheck,
	IconCreditCard,
	IconInbox,
	IconReportAnalytics,
	IconRobot,
	IconSchool,
	IconSend,
	IconUserCheck,
	IconUserExclamation,
	IconUserOff,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import type { NavItem } from '../module-config.types';

export const financeNav: NavItem[] = [
	{
		label: 'Sponsors',
		href: '/finance/sponsors',
		icon: IconBuildingBank,
		permissions: [{ resource: 'sponsors', action: 'read' }],
	},
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
	},
	{
		label: 'Registration',
		href: '/registry/registration/requests',
		icon: IconUserPlus,
		permissions: [{ resource: 'registration', action: 'read' }],
	},
	{
		label: 'Registration Clearance',
		href: '/registry/registration/clearance',
		icon: IconClipboardCheck,
		permissions: [{ resource: 'registration-clearance', action: 'read' }],
		notificationCount: {
			queryKey: ['clearances', 'pending'],
			queryFn: () => countPendingClearances(),
			color: 'red',
		},
	},
	{
		label: 'Auto-Approvals',
		href: '/registry/clearance/auto-approve',
		icon: IconRobot,
		permissions: [{ resource: 'auto-approvals', action: 'read' }],
	},
	{
		label: 'Graduations',
		icon: IconSchool,
		collapsed: true,
		permissions: [{ resource: 'graduation', action: 'read' }],
		children: [
			{
				label: 'Requests',
				href: '/registry/graduation/requests',
				icon: IconCertificate,
			},
		],
	},
	{
		label: 'Graduation Clearance',
		href: '/registry/graduation/clearance',
		icon: IconCertificate,
		permissions: [{ resource: 'graduation-clearance', action: 'read' }],
		notificationCount: {
			queryKey: ['graduation-clearances', 'pending'],
			queryFn: () => countPendingGraduationClearances(),
			color: 'red',
		},
	},
	{
		label: 'Student Status',
		href: '/registry/student-statuses',
		icon: IconUserExclamation,
		permissions: [{ resource: 'student-statuses', action: 'read' }],
		notificationCount: {
			queryKey: ['student-statuses', 'pending'],
			queryFn: () => countPendingStudentStatuses(),
			color: 'red',
		},
	},
	{
		label: 'Blocked Students',
		href: '/registry/blocked-students',
		icon: IconUserOff,
		permissions: [{ resource: 'blocked-students', action: 'read' }],
	},
	{
		label: 'Admissions Payments',
		href: '/admissions/payments',
		icon: IconCreditCard,
		permissions: [{ resource: 'admissions-payments', action: 'read' }],
		notificationCount: {
			queryKey: ['payments', 'pending-review-count'],
			queryFn: countPendingPaymentsForReview,
			color: 'red',
		},
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
		label: 'Sponsored Students Report',
		href: '/reports/finance/sponsored-students',
		icon: IconReportAnalytics,
		permissions: [{ resource: 'reports-sponsored-students', action: 'read' }],
	},
	{
		label: 'Tasks',
		href: '/admin/tasks',
		icon: IconChecklist,
		permissions: [{ resource: 'tasks', action: 'read' }],
	},
	{
		label: 'Activity Tracker',
		href: '/admin/activity-tracker',
		icon: IconReportAnalytics,
		permissions: [{ resource: 'activity-tracker', action: 'read' }],
	},
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
];
