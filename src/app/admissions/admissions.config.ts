import {
	IconBook,
	IconBuildingCommunity,
	IconCalendarEvent,
	IconCertificate,
	IconChecklist,
	IconClipboardList,
	IconCreditCard,
	IconReportAnalytics,
	IconUsers,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import { countPendingApplications } from './applications/_server/actions';

export const admissionsConfig: ModuleConfig = {
	id: 'admissions',
	name: 'Admissions',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Intake Periods',
				href: '/admissions/intake-periods',
				icon: IconCalendarEvent,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Certificate Types',
				href: '/admissions/certificate-types',
				icon: IconCertificate,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Subjects',
				href: '/admissions/subjects',
				icon: IconBook,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Recognized Schools',
				href: '/admissions/recognized-schools',
				icon: IconBuildingCommunity,
				roles: ['registry', 'marketing', 'admin'],
			},
			{
				label: 'Entry Requirements',
				href: '/admissions/entry-requirements',
				icon: IconChecklist,
				roles: ['registry', 'marketing', 'admin'],
			},
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
				notificationCount: {
					queryKey: ['applications', 'pending-count'],
					queryFn: countPendingApplications,
					color: 'red',
				},
			},
			{
				label: 'Payments',
				href: '/admissions/payments',
				icon: IconCreditCard,
				roles: ['registry', 'finance', 'admin', 'marketing'],
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
					},
					{
						label: 'Demographics',
						href: '/admissions/reports/demographics',
					},
					{
						label: 'Geographic',
						href: '/admissions/reports/geographic',
					},
					{
						label: 'Program Demand',
						href: '/admissions/reports/program-demand',
					},
					{
						label: 'Academic Qualifications',
						href: '/admissions/reports/academic-qualifications',
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
