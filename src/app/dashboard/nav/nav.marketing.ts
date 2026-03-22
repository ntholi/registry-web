import {
	IconBook,
	IconBuildingCommunity,
	IconCalendarEvent,
	IconCertificate,
	IconChartBar,
	IconChecklist,
	IconClipboardList,
	IconCreditCard,
	IconFileAnalytics,
	IconFileSearch,
	IconInbox,
	IconMapPin,
	IconReportAnalytics,
	IconSchool,
	IconSend,
	IconSettings,
	IconUserCheck,
	IconUsers,
	IconUsersGroup,
} from '@tabler/icons-react';
import { countPendingDocumentsForReview } from '@/app/admissions/documents/_server/actions';
import { countPendingPaymentsForReview } from '@/app/admissions/payments/_server/actions';
import type { NavItem } from '../module-config.types';

export const marketingNav: NavItem[] = [
	{
		label: 'Applicants',
		href: '/admissions/applicants',
		icon: IconUsers,
		permissions: [{ resource: 'applicants', action: 'read' }],
	},
	{
		label: 'Applications',
		href: '/admissions/applications',
		icon: IconClipboardList,
		permissions: [{ resource: 'applications', action: 'read' }],
	},
	{
		label: 'Payments',
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
		label: 'Document Review',
		href: '/admissions/documents',
		icon: IconFileSearch,
		permissions: [{ resource: 'admissions-documents', action: 'read' }],
		notificationCount: {
			queryKey: ['documents', 'pending-review-count'],
			queryFn: countPendingDocumentsForReview,
			color: 'red',
		},
	},
	{
		label: 'Reports',
		icon: IconReportAnalytics,
		collapsed: true,
		permissions: [{ resource: 'applications', action: 'read' }],
		children: [
			{
				label: 'Application Summary',
				href: '/admissions/reports/application-summary',
				icon: IconFileAnalytics,
			},
			{
				label: 'Demographics',
				href: '/admissions/reports/demographics',
				icon: IconUsersGroup,
			},
			{
				label: 'Geographic',
				href: '/admissions/reports/geographic',
				icon: IconMapPin,
			},
			{
				label: 'Program Demand',
				href: '/admissions/reports/program-demand',
				icon: IconChartBar,
			},
			{
				label: 'Academic Qualifications',
				href: '/admissions/reports/academic-qualifications',
				icon: IconSchool,
			},
		],
	},
	{
		label: 'Settings',
		icon: IconSettings,
		collapsed: true,
		children: [
			{
				label: 'Intake Periods',
				href: '/admissions/intake-periods',
				icon: IconCalendarEvent,
				permissions: [{ resource: 'intake-periods', action: 'read' }],
			},
			{
				label: 'Certificate Types',
				href: '/admissions/certificate-types',
				icon: IconCertificate,
				permissions: [{ resource: 'certificate-types', action: 'read' }],
			},
			{
				label: 'Subjects',
				href: '/admissions/subjects',
				icon: IconBook,
				permissions: [{ resource: 'subjects', action: 'read' }],
			},
			{
				label: 'Recognized Schools',
				href: '/admissions/recognized-schools',
				icon: IconBuildingCommunity,
				permissions: [{ resource: 'recognized-schools', action: 'read' }],
			},
			{
				label: 'Entry Requirements',
				href: '/admissions/entry-requirements',
				icon: IconChecklist,
				permissions: [{ resource: 'entry-requirements', action: 'read' }],
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
