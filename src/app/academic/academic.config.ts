import {
	IconAB2,
	IconCopyCheck,
	IconNotebook,
	IconSchool,
} from '@tabler/icons-react';
import type { ModuleConfig } from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';

export const academicConfig: ModuleConfig = {
	id: 'academic',
	name: 'Academic',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Lecturers',
				href: '/academic/lecturers',
				roles: ['academic'],
				icon: IconSchool,
				isVisible: (session) => {
					const position = session?.user?.position;
					return !!(
						position &&
						['manager', 'admin', 'program_leader'].includes(position)
					);
				},
			},
			{
				label: 'Modules',
				description: 'Assessments',
				href: '/academic/assessments',
				icon: IconAB2,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Gradebook',
				icon: IconNotebook,
				roles: ['academic'],
				children: [],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
			{
				label: 'Course Summary',
				description: 'Course Summary Report',
				href: '/academic/reports/course-summary',
				icon: IconCopyCheck,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
		],
	},

	flags: {
		enabled: moduleConfig.academic,
		beta: false,
	},
};
