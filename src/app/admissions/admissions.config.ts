import {
	IconBook,
	IconCalendarEvent,
	IconCertificate,
	IconChecklist,
	IconClipboardList,
	IconUsers,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

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
				roles: ['registry', 'admin'],
			},
			{
				label: 'Certificate Types',
				href: '/admissions/certificate-types',
				icon: IconCertificate,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Subjects',
				href: '/admissions/subjects',
				icon: IconBook,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Entry Requirements',
				href: '/admissions/entry-requirements',
				icon: IconChecklist,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Applicants',
				href: '/admissions/applicants',
				icon: IconUsers,
				roles: ['registry', 'admin'],
			},
			{
				label: 'Applications',
				href: '/admissions/applications',
				icon: IconClipboardList,
				roles: ['registry', 'admin'],
			},
		] as NavItem[],
	},

	flags: {
		enabled: moduleConfig.admissions,
		beta: false,
	},
};
