import type { MantineColor, NavLinkProps } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import type { Session } from '@/core/auth';
import type { PermissionGrant, UserRole } from '@/core/auth/permissions';

export type NotificationConfig = {
	queryKey: string[];
	queryFn: () => Promise<number>;
	refetchInterval?: number;
	color?: MantineColor;
};

export type NavItem = {
	label: string | React.ReactNode;
	href?: string | ((department: string) => string);
	icon?: Icon;
	description?: string;
	roles?: UserRole[];
	permissions?: PermissionGrant[];
	isVisible?: (session: Session | null) => boolean;
	children?: NavItem[];
	notificationCount?: NotificationConfig;
	isLoading?: boolean;
	collapsed?: boolean;
} & Omit<NavLinkProps, 'children' | 'label'>;

export type ModuleConfig = {
	id: string;
	name: string;
	version: string;
	category: 'core' | 'plugin';
	navigation: {
		dashboard: NavItem[];
	};
	flags: {
		enabled: boolean;
		beta: boolean;
	};
};
