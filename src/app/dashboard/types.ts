import type { MantineColor, NavLinkProps } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import type { Session } from '@/core/auth';
import type { PermissionGrant } from '@/core/auth/permissions';

export type NotificationConfig = {
	queryKey: string[];
	queryFn: () => Promise<number>;
	refetchInterval?: number;
	color?: MantineColor;
};

export type NavItem = {
	label: string | React.ReactNode;
	href?: string;
	icon?: Icon;
	description?: string;
	permissions?: PermissionGrant[];
	isVisible?: (session: Session | null) => boolean;
	children?: NavItem[];
	notificationCount?: NotificationConfig;
	isLoading?: boolean;
	collapsed?: boolean;
} & Omit<NavLinkProps, 'children' | 'label'>;
