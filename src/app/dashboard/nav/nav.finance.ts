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
	IconListCheck,
	IconReportAnalytics,
	IconRobot,
	IconSchool,
	IconUserExclamation,
	IconUserOff,
	IconUsers,
} from '@tabler/icons-react';
import type { NavItem } from '../types';

export const financeNav: NavItem[] = [
	{
		label: 'Students',
		href: '/registry/students',
		icon: IconUsers,
		permissions: [{ resource: 'students', action: 'read' }],
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
		label: 'Clearance',
		icon: IconListCheck,
		children: [
			{
				label: 'Registration',
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
				label: 'Graduation',
				href: '/registry/graduation/clearance',
				icon: IconCertificate,
				permissions: [{ resource: 'graduation-clearance', action: 'read' }],
				notificationCount: {
					queryKey: ['graduation-clearances', 'pending'],
					queryFn: () => countPendingGraduationClearances(),
					color: 'red',
				},
			},
		],
	},
	{
		label: 'Auto-Approvals',
		href: '/registry/clearance/auto-approve',
		icon: IconRobot,
		permissions: [{ resource: 'auto-approvals', action: 'read' }],
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
		label: 'Blocked Students',
		href: '/registry/blocked-students',
		icon: IconUserOff,
		permissions: [{ resource: 'blocked-students', action: 'read' }],
	},
	{
		label: 'Sponsors',
		href: '/finance/sponsors',
		icon: IconBuildingBank,
		permissions: [{ resource: 'sponsors', action: 'read' }],
	},
	{
		label: 'Reports',
		icon: IconReportAnalytics,
		collapsed: false,
		children: [
			{
				label: 'Student Enrollments',
				href: '/reports/registry/student-enrollments',
				icon: IconReportAnalytics,
				permissions: [{ resource: 'reports-enrollments', action: 'read' }],
			},
			{
				label: 'Graduations',
				href: '/reports/registry/graduations',
				icon: IconSchool,
				permissions: [{ resource: 'reports-graduation', action: 'read' }],
			},
			{
				label: 'Sponsored Students',
				href: '/reports/finance/sponsored-students',
				icon: IconReportAnalytics,
				permissions: [
					{ resource: 'reports-sponsored-students', action: 'read' },
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
	{
		label: 'Activity Tracker',
		href: '/admin/activity-tracker',
		icon: IconReportAnalytics,
		permissions: [{ resource: 'activity-tracker', action: 'read' }],
	},
];
