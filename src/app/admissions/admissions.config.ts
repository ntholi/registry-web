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
	IconMapPin,
	IconReportAnalytics,
	IconSchool,
	IconSettings,
	IconUsers,
	IconUsersGroup,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import { countPendingDocumentsForReview } from './documents/_server/actions';

export const admissionsConfig: ModuleConfig = {
	id: 'admissions',
	name: 'Admissions',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Applicants',
				href: '/admissions/applicants',
				icon: IconUsers,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Applications',
				href: '/admissions/applications',
				icon: IconClipboardList,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Payments',
				href: '/admissions/payments',
				icon: IconCreditCard,
				roles: ['finance', 'admin'],
			},
			{
				label: 'Document Review',
				href: '/admissions/documents',
				icon: IconFileSearch,
				roles: ['registry', 'marketing', 'admin'],
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
				roles: ['registry', 'marketing', 'admin'],
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
				roles: ['registry', 'marketing', 'admin'],
				children: [
					{
						label: 'Intake Periods',
						href: '/admissions/intake-periods',
						icon: IconCalendarEvent,
					},
					{
						label: 'Certificate Types',
						href: '/admissions/certificate-types',
						icon: IconCertificate,
					},
					{
						label: 'Subjects',
						href: '/admissions/subjects',
						icon: IconBook,
					},
					{
						label: 'Recognized Schools',
						href: '/admissions/recognized-schools',
						icon: IconBuildingCommunity,
					},
					{
						label: 'Entry Requirements',
						href: '/admissions/entry-requirements',
						icon: IconChecklist,
					},
				],
			},
		],
	},

	flags: {
		enabled: moduleConfig.admissions,
		beta: false,
	},
};
