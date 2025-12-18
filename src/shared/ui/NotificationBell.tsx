'use client';

import {
	dismissNotification,
	getActiveNotificationsForUser,
} from '@admin/notifications';
import {
	ActionIcon,
	Badge,
	Box,
	Divider,
	Group,
	Indicator,
	Modal,
	Popover,
	ScrollArea,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell, IconTrash } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { truncateText } from '@/shared/lib/utils/utils';

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
	const [modalOpened, { open: openModal, close: closeModal }] =
		useDisclosure(false);
	const [selectedNotification, setSelectedNotification] =
		useState<Notification | null>(null);

	const { data: notifications = [], isLoading } = useQuery({
		queryKey: ['user-notifications'],
		queryFn: getActiveNotificationsForUser,
		refetchInterval: 60000,
	});

	const handleDismiss = async (notificationId: number) => {
		await dismissNotification(notificationId);
		queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
	};

	const handleNotificationClick = async (notification: Notification) => {
		setSelectedNotification(notification);
		openModal();
		await handleDismiss(notification.id);
	};

	const unreadCount = notifications.length;

	const formatDate = (date: Date | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
		}).format(new Date(date));
	};

	return (
		<>
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
										onClick={() => handleNotificationClick(notification)}
										onDismiss={(e) => {
											e.stopPropagation();
											handleDismiss(notification.id);
										}}
									/>
								))}
							</Stack>
						)}
					</ScrollArea.Autosize>
				</Popover.Dropdown>
			</Popover>

			<Modal
				opened={modalOpened}
				onClose={closeModal}
				size='lg'
				centered
				padding='xl'
				radius='md'
				styles={{
					title: {
						fontSize: '1.25rem',
						fontWeight: 600,
					},
				}}
				title={selectedNotification?.title}
			>
				{selectedNotification && (
					<Stack gap='sm'>
						<Text>{selectedNotification.message}</Text>

						<Box>
							<Divider my={'sm'} />
							<Text size='xs' c='dimmed'>
								Date
							</Text>
							<Text size='xs'>
								{formatDate(selectedNotification.createdAt)}
							</Text>
						</Box>
					</Stack>
				)}
			</Modal>
		</>
	);
}

type NotificationItemProps = {
	notification: Notification;
	onClick: () => void;
	onDismiss: (e: React.MouseEvent) => void;
};

function NotificationItem({
	notification,
	onClick,
	onDismiss,
}: NotificationItemProps) {
	const theme = useMantineTheme();
	const [isHovered, setIsHovered] = useState(false);

	const formatRelativeTime = (date: Date | null) => {
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
			onClick={onClick}
			style={{
				borderBottom: `1px solid ${theme.colors.dark[5]}`,
				cursor: 'pointer',
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
					<Text size='xs' c='dimmed' mt={4}>
						{truncateText(notification.message, 100)}
					</Text>
					<Text size='xs' c='dimmed' mt={4}>
						{formatRelativeTime(notification.createdAt)}
					</Text>
				</Box>
				<ActionIcon
					size='sm'
					variant='subtle'
					color='red'
					onClick={onDismiss}
					style={{ opacity: isHovered ? 1 : 0.5 }}
				>
					<IconTrash size={16} />
				</ActionIcon>
			</Group>
		</Box>
	);
}
