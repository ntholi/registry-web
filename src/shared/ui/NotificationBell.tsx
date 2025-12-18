'use client';

import {
	dismissNotification,
	getActiveNotificationsForUser,
} from '@admin/notifications';
import {
	ActionIcon,
	Badge,
	Box,
	CloseButton,
	Group,
	Indicator,
	Popover,
	ScrollArea,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

type Notification = {
	id: number;
	title: string;
	message: string;
	visibleFrom: Date;
	visibleUntil: Date;
	createdAt: Date | null;
};

export default function NotificationBell() {
	const theme = useMantineTheme();
	const queryClient = useQueryClient();
	const [opened, { toggle }] = useDisclosure(false);

	const { data: notifications = [], isLoading } = useQuery({
		queryKey: ['user-notifications'],
		queryFn: getActiveNotificationsForUser,
		refetchInterval: 60000,
	});

	const handleDismiss = async (notificationId: number) => {
		await dismissNotification(notificationId);
		queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
	};

	const unreadCount = notifications.length;

	return (
		<Popover
			width={360}
			position='bottom-end'
			shadow='lg'
			opened={opened}
			onChange={toggle}
			withArrow
		>
			<Popover.Target>
				<Indicator
					inline
					label={unreadCount > 9 ? '9+' : unreadCount}
					size={18}
					disabled={unreadCount === 0}
					color='red'
					processing={isLoading}
				>
					<ActionIcon
						variant='default'
						size='lg'
						onClick={toggle}
						aria-label='Notifications'
					>
						<IconBell size={20} />
					</ActionIcon>
				</Indicator>
			</Popover.Target>

			<Popover.Dropdown p={0}>
				<Box
					p='sm'
					style={{ borderBottom: `1px solid ${theme.colors.dark[4]}` }}
				>
					<Group justify='space-between'>
						<Text fw={600} size='sm'>
							Notifications
						</Text>
						{unreadCount > 0 && (
							<Badge size='sm' variant='light'>
								{unreadCount} new
							</Badge>
						)}
					</Group>
				</Box>

				<ScrollArea.Autosize mah={400}>
					{notifications.length === 0 ? (
						<Box p='xl' ta='center'>
							<Text c='dimmed' size='sm'>
								No notifications
							</Text>
						</Box>
					) : (
						<Stack gap={0}>
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
									onDismiss={() => handleDismiss(notification.id)}
								/>
							))}
						</Stack>
					)}
				</ScrollArea.Autosize>
			</Popover.Dropdown>
		</Popover>
	);
}

type NotificationItemProps = {
	notification: Notification;
	onDismiss: () => void;
};

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
	const theme = useMantineTheme();
	const [isHovered, setIsHovered] = useState(false);

	const formatDate = (date: Date | null) => {
		if (!date) return '';
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(
			new Date(date)
		);
	};

	return (
		<Box
			p='sm'
			style={{
				borderBottom: `1px solid ${theme.colors.dark[5]}`,
				cursor: 'default',
				transition: 'background-color 0.15s ease',
				backgroundColor: isHovered ? theme.colors.dark[6] : 'transparent',
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Group justify='space-between' align='flex-start' wrap='nowrap'>
				<Box style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={600} lineClamp={1}>
						{notification.title}
					</Text>
					<Text size='xs' c='dimmed' lineClamp={2} mt={4}>
						{notification.message}
					</Text>
					<Text size='xs' c='dimmed' mt={4}>
						{formatDate(notification.createdAt)}
					</Text>
				</Box>
				<CloseButton
					size='sm'
					onClick={(e) => {
						e.stopPropagation();
						onDismiss();
					}}
					style={{ opacity: isHovered ? 1 : 0.5 }}
				/>
			</Group>
		</Box>
	);
}
