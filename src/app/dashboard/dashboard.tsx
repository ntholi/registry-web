'use client';

import { getAssignedModulesByCurrentUser } from '@academic/assigned-modules';
import { getUserSchools } from '@admin/users';
import {
	ActionIcon,
	Avatar,
	Flex,
	Group,
	Indicator,
	NavLink,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
	IconChevronRight,
	IconChevronUp,
	IconLogout2,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';
import { academicConfig } from '@/app/academic/academic.config';
import { adminConfig } from '@/app/admin/admin.config';
import { financeConfig } from '@/app/finance/finance.config';
import { lmsConfig } from '@/app/lms/lms.config';
import { registryConfig } from '@/app/registry/registry.config';
import type { ClientModuleConfig } from '@/config/modules.config';
import type { DashboardUser, UserRole } from '@/modules/auth/database';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Shell } from '@/shared/ui/adease';
import Logo from '@/shared/ui/Logo';
import { timetableConfig } from '../timetable/timetable.config';
import type { NavItem } from './module-config.types';

function getNavigation(
	department: DashboardUser,
	moduleConfig: ClientModuleConfig
) {
	const allConfigs = [
		{ config: timetableConfig, enabled: moduleConfig.timetable },
		{ config: academicConfig, enabled: moduleConfig.academic },
		{ config: lmsConfig, enabled: moduleConfig.lms },
		{ config: registryConfig, enabled: moduleConfig.registry },
		{ config: financeConfig, enabled: moduleConfig.finance },
		{ config: adminConfig, enabled: moduleConfig.admin },
	];

	const navItems: NavItem[] = [];

	for (const { config, enabled } of allConfigs) {
		if (enabled && config.flags.enabled) {
			navItems.push(...config.navigation.dashboard);
		}
	}

	const combinedItems: NavItem[] = [];
	const itemMap = new Map<string, NavItem>();
	const reportItems: NavItem[] = [];

	const reportLabels = [
		'Course Summary',
		'Clearance',
		'Board of Examination',
		'Student Registration',
	];

	for (const item of navItems) {
		if (reportLabels.includes(item.label)) {
			reportItems.push(item);
			continue;
		}

		const key = item.label;

		if (itemMap.has(key)) {
			const existing = itemMap.get(key)!;
			if (item.children && existing.children) {
				const childrenMap = new Map<string, NavItem>();
				for (const child of existing.children) {
					const childKey =
						typeof child.href === 'string' ? child.href : child.label;
					childrenMap.set(childKey, child);
				}
				for (const child of item.children) {
					const childKey =
						typeof child.href === 'string' ? child.href : child.label;
					if (!childrenMap.has(childKey)) {
						existing.children.push(child);
					}
				}
			} else if (item.children && !existing.children) {
				existing.children = item.children;
			}
		} else {
			itemMap.set(key, { ...item });
			combinedItems.push(itemMap.get(key)!);
		}
	}

	const reportsParent = combinedItems.find((item) => item.label === 'Reports');
	if (reportsParent && reportItems.length > 0) {
		reportsParent.children = reportItems;
	}

	for (const item of combinedItems) {
		if (item.children) {
			for (let i = 0; i < item.children.length; i++) {
				const child = item.children[i];
				if (typeof child.href === 'function') {
					item.children[i] = {
						...child,
						href: child.href(department),
					};
				}
			}
		}
	}

	return combinedItems;
}

export default function Dashboard({
	children,
	moduleConfig,
}: {
	children: React.ReactNode;
	moduleConfig: ClientModuleConfig;
}) {
	const { data: session } = useSession();
	const navigation = getNavigation(
		session?.user?.role as DashboardUser,
		moduleConfig
	);

	const { data: assignedModules, isLoading: isModulesLoading } = useQuery({
		queryKey: ['assigned-modules'],
		queryFn: getAssignedModulesByCurrentUser,
		enabled: session?.user?.role === 'academic',
	});

	for (const nav of navigation) {
		if (nav.label === 'Gradebook') {
			nav.isLoading = isModulesLoading && session?.user?.role === 'academic';
			if (!isModulesLoading && assignedModules) {
				nav.children = assignedModules.map((it) => ({
					label: it?.semesterModule?.module?.code || 'Unknown Module',
					description: it?.semesterModule?.module?.name || 'Unknown Module',
					href: `/academic/gradebook/${it?.semesterModule.moduleId}`,
				}));
			}
		}
	}

	return (
		<Shell>
			<Shell.Header>
				<Link href='/dashboard' style={{ textDecoration: 'none' }}>
					<Logo />
				</Link>
			</Shell.Header>
			<Shell.Navigation>
				<Navigation navigation={navigation} />
			</Shell.Navigation>
			<Shell.Body>{children}</Shell.Body>
			<Shell.User>
				<UserButton />
			</Shell.User>
		</Shell>
	);
}

function UserButton() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const { data: userSchools } = useQuery({
		queryKey: ['user-schools'],
		queryFn: () => getUserSchools(session?.user?.id),
		enabled: session?.user?.role === 'academic',
	});

	if (status === 'unauthenticated') {
		router.push('/auth/login');
	}
	const user = session?.user;

	const openModal = () =>
		modals.openConfirmModal({
			centered: true,
			title: 'Confirm logout',
			children: 'Are you sure you want to logout?',
			confirmProps: { color: 'dark' },
			labels: { confirm: 'Logout', cancel: 'Cancel' },
			onConfirm: async () => await signOut(),
		});

	return (
		<Flex mt={'md'} mb={'sm'} justify='space-between' align={'center'}>
			<Group>
				<Avatar src={user?.image} />
				<Stack gap={5}>
					<Text size='0.9rem'>{user?.name}</Text>
					<Text size='0.7rem' c={'dimmed'}>
						{user?.email}
					</Text>
					<Text size='0.65rem' c={'dimmed'}>
						{user?.role === 'academic'
							? userSchools?.map((it) => it.school.code).join(', ')
							: toTitleCase(user?.role)}
						{user?.position ? ` | ${toTitleCase(user.position)}` : ''}
					</Text>
				</Stack>
			</Group>
			<ActionIcon variant='default' size={'lg'}>
				<IconLogout2 size='1rem' onClick={openModal} />
			</ActionIcon>
		</Flex>
	);
}

export function Navigation({ navigation }: { navigation: NavItem[] }) {
	return (
		<>
			{navigation.map((item) => {
				const key = typeof item.href === 'string' ? item.href : item.label;
				return <DisplayWithNotification key={key} item={item} />;
			})}
		</>
	);
}

function DisplayWithNotification({ item }: { item: NavItem }) {
	const { data: notificationCount = 0 } = useQuery({
		queryKey: item.notificationCount?.queryKey ?? [],
		queryFn: () => item.notificationCount?.queryFn() ?? Promise.resolve(0),
		enabled: !!item.notificationCount,
		refetchInterval: item.notificationCount?.refetchInterval,
	});

	return (
		<Indicator
			position='middle-end'
			color={item.notificationCount?.color ?? 'red'}
			offset={20}
			size={23}
			label={notificationCount}
			disabled={!notificationCount}
		>
			<ItemDisplay item={item} />
		</Indicator>
	);
}

function ItemDisplay({ item }: { item: NavItem }) {
	const pathname = usePathname();
	const Icon = item.icon;
	const { data: session } = useSession();
	const [opened, setOpen] = React.useState(!item.collapsed);

	if (item.isVisible && !item.isVisible(session)) {
		return null;
	}

	if (
		item.roles &&
		(!session?.user?.role ||
			!item.roles.includes(session.user.role as UserRole))
	) {
		return null;
	}

	if (item.isLoading) {
		return (
			<NavLink
				label={item.label}
				leftSection={Icon ? <Icon size='1.1rem' /> : null}
				description={item.description}
				opened={true}
			>
				{[1, 2, 3].map((i) => (
					<NavLink
						key={`skeleton-${i}`}
						label={
							<Stack gap={5}>
								<Skeleton height={28} width='60%' radius='sm' animate />
								<Skeleton height={12} width='90%' radius='sm' animate />
							</Stack>
						}
					/>
				))}
			</NavLink>
		);
	}

	const href = typeof item.href === 'function' ? undefined : item.href;
	const isActive =
		href && typeof href === 'string' ? pathname.startsWith(href) : false;

	const navLink = (
		<NavLink
			label={item.label}
			component={href ? Link : undefined}
			href={href || '#something'}
			active={isActive}
			leftSection={Icon ? <Icon size='1.1rem' /> : null}
			description={item.description}
			rightSection={
				item.children && item.children.length > 0 ? (
					<IconChevronRight size='0.8rem' stroke={1.5} />
				) : (
					<IconChevronUp size='0.8rem' stroke={1.5} />
				)
			}
			opened={opened}
			onClick={() => setOpen((o) => !o)}
		>
			{item.children?.map((child) => {
				const childKey =
					typeof child.href === 'string' ? child.href : child.label;
				return <DisplayWithNotification key={childKey} item={child} />;
			})}
		</NavLink>
	);
	return navLink;
}
