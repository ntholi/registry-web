'use client';

import { getAssignedModulesByCurrentUser } from '@academic/assigned-modules';
import { getUserSchools } from '@admin/users';
import type { DashboardUser, UserRole } from '@auth/_database';
import {
	ActionIcon,
	Avatar,
	Box,
	Divider,
	Flex,
	Group,
	Indicator,
	NavLink,
	Skeleton,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconLogout2, IconSearch } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import type React from 'react';
import { useState } from 'react';
import { academicConfig } from '@/app/academic/academic.config';
import { adminConfig } from '@/app/admin/admin.config';
import { admissionsConfig } from '@/app/admissions/admissions.config';
import { financeConfig } from '@/app/finance/finance.config';
import { lmsConfig } from '@/app/lms/lms.config';
import { registryConfig } from '@/app/registry/registry.config';
import { reportsConfig } from '@/app/reports/reports.config';
import type { ClientModuleConfig } from '@/config/modules.config';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Shell } from '@/shared/ui/adease';
import Logo from '@/shared/ui/Logo';
import { timetableConfig } from '../timetable/timetable.config';
import type { NavItem } from './module-config.types';

type NavigationGroup = {
	moduleName: string;
	items: NavItem[];
};

function isItemVisible(item: NavItem, session: Session | null): boolean {
	if (item.isVisible && !item.isVisible(session)) {
		return false;
	}

	if (
		item.roles &&
		(!session?.user?.role ||
			!item.roles.includes(session.user.role as UserRole))
	) {
		return false;
	}

	return true;
}

function filterNavigationItems(
	items: NavItem[],
	session: Session | null
): NavItem[] {
	return items
		.filter((item) => isItemVisible(item, session))
		.map((item) => {
			if (!item.children) {
				return item;
			}

			const children = filterNavigationItems(item.children, session);
			if (children.length === 0) {
				return { ...item, children: undefined };
			}

			return { ...item, children };
		})
		.filter((item) => !!item.href || (item.children?.length ?? 0) > 0);
}

function getNavigation(
	department: DashboardUser,
	moduleConfig: ClientModuleConfig
): NavigationGroup[] {
	const allConfigs = [
		{ config: timetableConfig, enabled: moduleConfig.timetable },
		{ config: academicConfig, enabled: moduleConfig.academic },
		{ config: lmsConfig, enabled: moduleConfig.lms },
		{ config: registryConfig, enabled: moduleConfig.registry },
		{ config: admissionsConfig, enabled: moduleConfig.admissions },
		{ config: financeConfig, enabled: moduleConfig.finance },
		{ config: adminConfig, enabled: moduleConfig.admin },
		{ config: reportsConfig, enabled: moduleConfig.reports },
	];

	const getLabelKey = (label: React.ReactNode): string => {
		if (typeof label === 'string') return label;
		return String(label);
	};

	const normalizeItems = (items: NavItem[]): NavItem[] => {
		const combinedItems: NavItem[] = [];
		const itemMap = new Map<string, NavItem>();

		for (const item of items) {
			const labelKey = getLabelKey(item.label);
			const key = labelKey;

			if (itemMap.has(key)) {
				const existing = itemMap.get(key)!;
				if (item.children && existing.children) {
					const childrenMap = new Map<string, NavItem>();
					for (const child of existing.children) {
						const childKey =
							typeof child.href === 'string'
								? child.href
								: getLabelKey(child.label);
						childrenMap.set(childKey, child);
					}
					for (const child of item.children) {
						const childKey =
							typeof child.href === 'string'
								? child.href
								: getLabelKey(child.label);
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
	};

	const groups: NavigationGroup[] = [];
	for (const { config, enabled } of allConfigs) {
		if (enabled && config.flags.enabled) {
			groups.push({
				moduleName: config.name,
				items: normalizeItems(config.navigation.dashboard),
			});
		}
	}

	return groups;
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

	for (const group of navigation) {
		for (const nav of group.items) {
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

export function Navigation({ navigation }: { navigation: NavigationGroup[] }) {
	const { data: session } = useSession();
	const [search, setSearch] = useState('');

	const getLabelKey = (label: React.ReactNode): string => {
		if (typeof label === 'string') return label;
		return String(label);
	};

	const filterBySearch = (items: NavItem[], query: string): NavItem[] => {
		if (!query) return items;
		const s = query.toLowerCase();

		return items.reduce((acc, item) => {
			const label = typeof item.label === 'string' ? item.label : '';
			const matches =
				label.toLowerCase().includes(s) ||
				item.description?.toLowerCase().includes(s);

			const filteredChildren = item.children
				? filterBySearch(item.children, query)
				: undefined;

			if (matches || (filteredChildren && filteredChildren.length > 0)) {
				acc.push({
					...item,
					children: filteredChildren,
				});
			}

			return acc;
		}, [] as NavItem[]);
	};

	const visibleGroups = navigation
		.map((group) => ({
			...group,
			items: filterNavigationItems(group.items, session ?? null),
		}))
		.map((group) => ({
			...group,
			items: filterBySearch(group.items, search),
		}))
		.filter((group) => group.items.length > 0);

	return (
		<Stack gap='md'>
			<Box>
				<TextInput
					placeholder='Search menu...'
					leftSection={<IconSearch size='1rem' />}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					variant='unstyled'
				/>
				<Divider mt={5} />
			</Box>

			{visibleGroups.map((group) => (
				<Stack key={group.moduleName} gap={6}>
					<Text size='0.7rem' fw={600} c='dimmed' tt='uppercase'>
						{group.moduleName}
					</Text>
					<Stack gap={4}>
						{group.items.map((item) => {
							const key =
								typeof item.href === 'string'
									? item.href
									: getLabelKey(item.label);
							return <DisplayWithNotification key={key} item={item} />;
						})}
					</Stack>
				</Stack>
			))}
		</Stack>
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
	const getLabelKey = (label: React.ReactNode): string => {
		if (typeof label === 'string') return label;
		return String(label);
	};

	if (!isItemVisible(item, session ?? null)) {
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

	const hasChildren = item.children && item.children.length > 0;

	const navLink = (
		<NavLink
			label={item.label}
			component={href ? Link : undefined}
			href={href || '#'}
			active={isActive}
			leftSection={Icon ? <Icon size='1.1rem' /> : null}
			description={item.description}
			opened={hasChildren}
		>
			{item.children?.map((child) => {
				const childKey =
					typeof child.href === 'string'
						? child.href
						: getLabelKey(child.label);
				return <DisplayWithNotification key={childKey} item={child} />;
			})}
		</NavLink>
	);
	return navLink;
}
