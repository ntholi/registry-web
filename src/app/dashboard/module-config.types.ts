import type { MantineColor, NavLinkProps } from '@mantine/core';
import type { Icon } from '@tabler/icons-react';
import type { Session } from 'next-auth';
import type { UserRole } from '@/shared/db/schema';

export type NotificationConfig = {
	queryKey: string[];
	queryFn: () => Promise<number>;
	refetchInterval?: number;
	color?: MantineColor;
};

export type NavItem = {
	label: string;
	href?: string | ((department: string) => string);
	icon?: Icon;
	description?: string;
	roles?: UserRole[];
	isVisible?: (session: Session | null) => boolean;
	children?: NavItem[];
	notificationCount?: NotificationConfig;
	isLoading?: boolean;
	collapsed?: boolean;
} & Omit<NavLinkProps, 'children'>;

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
