import { countByStatus as countGraduationByStatus } from '@registry/graduation/clearance';
import { countByStatus } from '@registry/registration';
import {
	IconBan,
	IconCalendarMonth,
	IconChartDonut,
	IconCheck,
	IconCircleCheck,
	IconClipboardList,
	IconFileDescription,
	IconGavel,
	IconHourglass,
	IconSchoolBell,
	IconUsers,
} from '@tabler/icons-react';
import type {
	ModuleConfig,
	NavItem,
} from '@/app/dashboard/module-config.types';
import { moduleConfig } from '@/config/modules.config';
import type { UserPosition, UserRole } from '@/core/database';

export const registryConfig: ModuleConfig = {
	id: 'registry',
	name: 'Registry',
	version: '1.0.0',
	category: 'core',

	navigation: {
		dashboard: [
			{
				label: 'Students',
				href: '/registry/students',
				icon: IconUsers,
				isVisible: (session) => {
					if (
						['registry', 'finance', 'admin', 'student_services'].includes(
							session?.user?.role || ''
						)
					) {
						return true;
					}
					const position = session?.user?.position;
					return !!(
						position &&
						['manager', 'admin', 'program_leader', 'year_leader'].includes(
							position
						)
					);
				},
			},
			{
				label: 'Registration Requests',
				icon: IconClipboardList,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Pending',
						href: '/registry/registration/requests/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['registration-requests', 'pending'],
							queryFn: () => countByStatus('pending'),
							color: 'red',
						},
					},
					{
						label: 'Registered',
						href: '/registry/registration/requests/registered',
						icon: IconCheck,
						notificationCount: {
							queryKey: ['registration-requests', 'registered'],
							queryFn: () => countByStatus('registered'),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registry/registration/requests/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['registration-requests', 'rejected'],
							queryFn: () => countByStatus('rejected'),
							color: 'gray',
						},
					},
					{
						label: 'Approved',
						href: '/registry/registration/requests/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['registration-requests', 'approved'],
							queryFn: () => countByStatus('approved'),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Graduation Requests',
				icon: IconSchoolBell,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Pending',
						href: '/registry/graduation/requests/pending',
						icon: IconHourglass,
						notificationCount: {
							queryKey: ['graduation-requests', 'pending'],
							queryFn: () => countGraduationByStatus('pending'),
							color: 'red',
						},
					},
					{
						label: 'Approved',
						href: '/registry/graduation/requests/approved',
						icon: IconCircleCheck,
						notificationCount: {
							queryKey: ['graduation-requests', 'approved'],
							queryFn: () => countGraduationByStatus('approved'),
							color: 'gray',
						},
					},
					{
						label: 'Rejected',
						href: '/registry/graduation/requests/rejected',
						icon: IconBan,
						notificationCount: {
							queryKey: ['graduation-requests', 'rejected'],
							queryFn: () => countGraduationByStatus('rejected'),
							color: 'gray',
						},
					},
				] as NavItem[],
			},
			{
				label: 'Dates',
				icon: IconSchoolBell,
				roles: ['registry', 'admin'],
				collapsed: true,
				children: [
					{
						label: 'Terms',
						href: '/registry/terms',
						icon: IconCalendarMonth,
						roles: ['admin', 'registry'],
					},
					{
						label: 'Graduations',
						href: '/registry/graduations',
						icon: IconCalendarMonth,
						roles: ['admin', 'registry'],
					},
				],
			},
			{
				label: 'Board of Examination',
				href: '/academic/reports/boe',
				icon: IconGavel,
				roles: ['academic', 'registry', 'admin'],
				isVisible: (session) => {
					if (['admin', 'registry'].includes(session?.user?.role as UserRole))
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
			{
				label: 'Student Enrollments',
				href: '/registry/reports/enrollments',
				icon: IconFileDescription,
				roles: ['academic', 'registry', 'admin', 'finance'],
				isVisible: (session) => {
					if (
						['admin', 'registry', 'finance'].includes(
							session?.user?.role as UserRole
						)
					)
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
			{
				label: 'Enrollment Distribution',
				href: '/registry/reports/distribution',
				icon: IconChartDonut,
				roles: ['academic', 'registry', 'admin', 'finance'],
				isVisible: (session) => {
					if (
						['admin', 'registry', 'finance'].includes(
							session?.user?.role as UserRole
						)
					)
						return true;
					const academicRole = session?.user?.position as UserPosition;
					return !!(
						academicRole &&
						['manager', 'admin', 'program_leader'].includes(academicRole)
					);
				},
			},
		],
	},

	flags: {
		enabled: moduleConfig.registry,
		beta: false,
	},
};
