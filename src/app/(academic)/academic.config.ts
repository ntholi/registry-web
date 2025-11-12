import {
	IconAB2,
	IconBuildingStore,
	IconCalculator,
	IconChartLine,
	IconCopyCheck,
	IconNotebook,
	IconSchool,
	IconTestPipe,
	IconTool,
} from '@tabler/icons-react';
import type { ModuleConfig, NavItem } from '@/app/dashboard/module-config.types';
import type { UserPosition, UserRole } from '@/db/schema';

export const academicConfig: ModuleConfig = {
	id: 'academic-management',
	name: 'Academic Management',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Lecturers',
				href: '/lecturers',
				roles: ['academic'],
				icon: IconSchool,
				isVisible: (session) => {
					const position = session?.user?.position;
					return !!(
						position && ['manager', 'admin', 'program_leader'].includes(position)
					);
				},
			},
			{
				label: 'Modules',
				description: 'Assessments',
				href: '/assessments',
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
				href: '/reports/course-summary',
				icon: IconCopyCheck,
				roles: ['academic'],
				isVisible: (session) => {
					return session?.user?.position !== 'admin';
				},
			},
		],
	},

	flags: {
		enabled: true,
		beta: false,
	},
};
