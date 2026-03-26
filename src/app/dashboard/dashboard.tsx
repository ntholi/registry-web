'use client';

import { getAssignedModulesByCurrentUser } from '@academic/assigned-modules';
import { Indicator, NavLink, Skeleton, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { isValidElement, useState } from 'react';
import type { Session, ViewAsData } from '@/core/auth';
import type { DashboardRole, PermissionGrant } from '@/core/auth/permissions';
import { authClient } from '@/core/auth-client';
import { Shell } from '@/shared/ui/adease';
import Logo from '@/shared/ui/Logo';
import { academicNav } from './nav/nav.academic';
import { adminNav } from './nav/nav.admin';
import { financeNav } from './nav/nav.finance';
import { humanResourceNav } from './nav/nav.human-resource';
import { libraryNav } from './nav/nav.library';
import { marketingNav } from './nav/nav.marketing';
import { registryNav } from './nav/nav.registry';
import { resourceNav } from './nav/nav.resource';
import { studentServicesNav } from './nav/nav.student-services';
import SearchInput from './search/SearchInput';
import SearchSpotlight from './search/SearchSpotlight';
import type { NavItem } from './types';
import UserButton from './UserButton';

const roleNavMap: Record<DashboardRole, NavItem[]> = {
	academic: academicNav,
	leap: academicNav,
	finance: financeNav,
	registry: registryNav,
	student_services: studentServicesNav,
	admin: adminNav,
	library: libraryNav,
	marketing: marketingNav,
	human_resource: humanResourceNav,
	resource: resourceNav,
};

function getUserPermissions(session: Session | null): PermissionGrant[] {
	return Array.isArray(session?.permissions) ? session.permissions : [];
}

function isItemVisible(
	item: NavItem,
	session: Session | null,
	userPermissions: PermissionGrant[],
	viewingAs?: boolean
): boolean {
	if (item.isVisible && !item.isVisible(session)) {
		return false;
	}

	if (session?.user?.role === 'admin' && !viewingAs) {
		return true;
	}

	if (item.permissions) {
		return item.permissions.every(({ resource, action }) =>
			userPermissions.some(
				(permission) =>
					permission.resource === resource && permission.action === action
			)
		);
	}

	return true;
}

function filterNavigationItems(
	items: NavItem[],
	session: Session | null,
	userPermissions: PermissionGrant[],
	viewingAs?: boolean
): NavItem[] {
	return items
		.filter((item) => isItemVisible(item, session, userPermissions, viewingAs))
		.map((item) => {
			if (!item.children) {
				return item;
			}

			const children = filterNavigationItems(
				item.children,
				session,
				userPermissions,
				viewingAs
			);
			if (children.length === 0) {
				return { ...item, children: undefined };
			}

			return { ...item, children };
		})
		.filter(
			(item) =>
				!!item.href || (item.children?.length ?? 0) > 0 || !!item.isLoading
		);
}

function getNavigation(role: DashboardRole): NavItem[] {
	return roleNavMap[role] ?? [];
}

function getLabelText(label: React.ReactNode): string {
	if (typeof label === 'string') return label;
	if (typeof label === 'number') return String(label);
	if (!label) return '';
	if (Array.isArray(label)) return label.map(getLabelText).join('');
	if (isValidElement<{ children?: React.ReactNode }>(label))
		return getLabelText(label.props.children);
	return '';
}

export default function Dashboard({
	children,
	viewAs,
}: {
	children: React.ReactNode;
	viewAs: ViewAsData | null;
}) {
	const { data: session } = authClient.useSession();

	const effectiveRole = viewAs?.role ?? session?.user?.role;
	const effectivePermissions =
		viewAs?.permissions ?? getUserPermissions(session);
	const effectiveSession: Session | null = viewAs
		? session
			? {
					...session,
					permissions: viewAs.permissions,
					viewingAs: viewAs,
					user: {
						...session.user,
						role: viewAs.role,
						presetId: viewAs.presetId,
						presetName: viewAs.presetName,
					},
				}
			: null
		: session;

	const navigation = getNavigation(effectiveRole as DashboardRole);

	const { data: assignedModules, isLoading: isModulesLoading } = useQuery({
		queryKey: ['assigned-modules'],
		queryFn: getAssignedModulesByCurrentUser,
		enabled: effectiveRole === 'academic',
	});

	for (const nav of navigation) {
		if (nav.label === 'Gradebook') {
			nav.isLoading = isModulesLoading && effectiveRole === 'academic';
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
		<>
			<SearchSpotlight />
			<Shell>
				<Shell.Header>
					<Link href='/dashboard' style={{ textDecoration: 'none' }}>
						<Logo />
					</Link>
				</Shell.Header>
				<Shell.Navigation>
					<Navigation
						items={navigation}
						userPermissions={effectivePermissions}
						viewingAs={!!viewAs}
						session={effectiveSession}
					/>
				</Shell.Navigation>
				<Shell.Body>{children}</Shell.Body>
				<Shell.User>
					<UserButton viewAs={viewAs} />
				</Shell.User>
			</Shell>
		</>
	);
}

export function Navigation({
	items,
	userPermissions,
	viewingAs,
	session: sessionProp,
}: {
	items: NavItem[];
	userPermissions: PermissionGrant[];
	viewingAs?: boolean;
	session?: Session | null;
}) {
	const { data: clientSession } = authClient.useSession();
	const session = sessionProp ?? clientSession;
	const [search, setSearch] = useState('');

	const filterBySearch = (navItems: NavItem[], query: string): NavItem[] => {
		if (!query) return navItems;
		const s = query.toLowerCase();

		return navItems.reduce((acc, item) => {
			const label = getLabelText(item.label);
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

	const visibleItems = filterNavigationItems(
		items,
		session ?? null,
		userPermissions,
		viewingAs
	);
	const filteredItems = filterBySearch(visibleItems, search);

	return (
		<Stack gap='md'>
			<SearchInput value={search} onChange={setSearch} />
			<Stack gap={4}>
				{filteredItems.map((item) => {
					const key =
						typeof item.href === 'string'
							? item.href
							: typeof item.label === 'string'
								? item.label
								: String(item.label);
					return (
						<DisplayWithNotification
							key={key}
							item={item}
							userPermissions={userPermissions}
							viewingAs={viewingAs}
							session={session}
						/>
					);
				})}
			</Stack>
		</Stack>
	);
}

function DisplayWithNotification({
	item,
	userPermissions,
	viewingAs,
	session,
}: {
	item: NavItem;
	userPermissions: PermissionGrant[];
	viewingAs?: boolean;
	session: Session | null;
}) {
	const canAccessItem = isItemVisible(
		item,
		session ?? null,
		userPermissions,
		viewingAs
	);
	const { data: notificationCount = 0 } = useQuery({
		queryKey: item.notificationCount?.queryKey ?? [],
		queryFn: () => item.notificationCount?.queryFn() ?? Promise.resolve(0),
		enabled: canAccessItem && !!item.notificationCount,
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
			<ItemDisplay
				item={item}
				userPermissions={userPermissions}
				viewingAs={viewingAs}
				session={session}
			/>
		</Indicator>
	);
}

function ItemDisplay({
	item,
	userPermissions,
	viewingAs,
	session,
}: {
	item: NavItem;
	userPermissions: PermissionGrant[];
	viewingAs?: boolean;
	session: Session | null;
}) {
	const pathname = usePathname();
	const Icon = item.icon;
	const canAccessItem = isItemVisible(
		item,
		session ?? null,
		userPermissions,
		viewingAs
	);
	if (!canAccessItem) {
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

	const isActive = item.href ? pathname.startsWith(item.href) : false;

	const hasChildren = item.children && item.children.length > 0;

	const navLink = (
		<NavLink
			label={item.label}
			component={item.href ? Link : undefined}
			href={item.href || '#'}
			active={isActive}
			leftSection={Icon ? <Icon size='1.1rem' /> : null}
			description={item.description}
			defaultOpened={hasChildren ? item.collapsed !== true : undefined}
		>
			{item.children?.map((child) => {
				const childKey =
					typeof child.href === 'string'
						? child.href
						: getLabelText(child.label) || String(child.label);
				return (
					<DisplayWithNotification
						key={childKey}
						item={child}
						userPermissions={userPermissions}
						viewingAs={viewingAs}
						session={session}
					/>
				);
			})}
		</NavLink>
	);
	return navLink;
}
