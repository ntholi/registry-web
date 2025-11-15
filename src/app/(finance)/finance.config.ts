import {
	countApprovedGraduationClearances,
	countPendingGraduationClearances,
	countRejectedGraduationClearances,
} from '@registry/graduation/clearance/server';
import {
	countApprovedClearances,
	countPendingClearances,
	countRejectedClearances,
} from '@registry/registration/server';
import {
	IconBarrierBlock,
	IconCertificate,
	IconCopyCheck,
	IconFileCheck,
	IconMessageQuestion,
	IconSquareRoundedCheck,
	IconUserX,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
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
				icon: IconFileCheck,
				roles: ['finance', 'library', 'resource'],
				children: [
					{
						label: 'Requests',
						href: '/registration/clearance/pending',
						icon: IconMessageQuestion,
						notificationCount: {
							queryKey: ['clearances', 'pending'],
							queryFn: () => countPendingClearances(),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/registration/clearance/approved',
						icon: IconSquareRoundedCheck,
						notificationCount: {
							queryKey: ['clearances', 'approved'],
							queryFn: () => countApprovedClearances(),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registration/clearance/rejected',
						icon: IconBarrierBlock,
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
						href: '/graduation/clearance/pending',
						icon: IconMessageQuestion,
						notificationCount: {
							queryKey: ['graduation-clearances', 'pending'],
							queryFn: () => countPendingGraduationClearances(),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/graduation/clearance/approved',
						icon: IconSquareRoundedCheck,
						notificationCount: {
							queryKey: ['graduation-clearances', 'approved'],
							queryFn: () => countApprovedGraduationClearances(),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/graduation/clearance/rejected',
						icon: IconBarrierBlock,
						notificationCount: {
							queryKey: ['graduation-clearances', 'rejected'],
							queryFn: () => countRejectedGraduationClearances(),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Blocked Students',
				href: '/blocked-students',
				icon: IconUserX,
				roles: ['finance'],
			},
			{
				label: 'Clearance',
				href: (department: string) => `/reports/clearance/${department}`,
				icon: IconCopyCheck,
				isVisible: (session) => {
					const userRole = session?.user?.role;
					return !!(
						session?.user?.position === 'manager' &&
						userRole &&
						['finance', 'library', 'resource'].includes(userRole)
					);
				},
			},
		],
	},

	flags: {
		enabled: true,
		beta: false,
	},
};
