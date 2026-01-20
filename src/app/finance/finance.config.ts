import {
	countApprovedGraduationClearances,
	countPendingGraduationClearances,
	countRejectedGraduationClearances,
} from '@registry/graduation/clearance';
import {
	countApprovedClearances,
	countPendingClearances,
	countRejectedClearances,
} from '@registry/registration';
import {
	IconBan,
	IconBuildingBank,
	IconCertificate,
	IconCircleCheck,
	IconClipboardCheck,
	IconHourglass,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '@/core/database';

export const financeConfig: ModuleConfig = {
	id: 'finance',
	name: 'Finance',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Registration Clearance',
				icon: IconClipboardCheck,
				roles: ['finance', 'library', 'resource'],
				children: [
					{
						label: 'Requests',
						href: '/registry/registration/clearance/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['clearances', 'pending'],
							queryFn: () => countPendingClearances(),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/registry/registration/clearance/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['clearances', 'approved'],
							queryFn: () => countApprovedClearances(),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registry/registration/clearance/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['clearances', 'rejected'],
							queryFn: () => countRejectedClearances(),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Graduation Clearance',
				icon: IconCertificate,
				isVisible: (session) => {
					if (['finance', 'library'].includes(session?.user?.role as UserRole))
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
				collapsed: true,
				children: [
					{
						label: 'Requests',
						href: '/registry/graduation/clearance/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['graduation-clearances', 'pending'],
							queryFn: () => countPendingGraduationClearances(),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/registry/graduation/clearance/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['graduation-clearances', 'approved'],
							queryFn: () => countApprovedGraduationClearances(),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registry/graduation/clearance/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['graduation-clearances', 'rejected'],
							queryFn: () => countRejectedGraduationClearances(),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Sponsors',
				href: '/finance/sponsors',
				icon: IconBuildingBank,
				roles: ['admin', 'finance'],
			},
		],
	},

	flags: {
		enabled: moduleConfig.finance,
		beta: false,
	},
};
