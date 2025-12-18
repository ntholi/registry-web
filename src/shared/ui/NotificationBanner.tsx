'use client';

import {
	dismissNotification,
	getActiveNotificationsForUser,
} from '@admin/notifications';
import { Alert, Container, Stack, Text, Transition } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function NotificationBanner() {
	const queryClient = useQueryClient();

	const { data: notifications = [] } = useQuery({
		queryKey: ['user-notifications'],
		queryFn: getActiveNotificationsForUser,
		refetchInterval: 60000,
	});

	const handleDismiss = async (notificationId: number) => {
		await dismissNotification(notificationId);
		queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
	};

	if (notifications.length === 0) {
		return null;
	}

	return (
		<Container size='xl' py='xs'>
			<Stack gap='xs'>
				{notifications.map((notification) => (
					<Transition
						key={notification.id}
						mounted={true}
						transition='slide-down'
						duration={300}
					>
						{(styles) => (
							<Alert
								style={styles}
								variant='light'
								color='blue'
								icon={<IconInfoCircle />}
								withCloseButton
								onClose={() => handleDismiss(notification.id)}
								title={notification.title}
							>
								<Text size='sm'>{notification.message}</Text>
							</Alert>
						)}
					</Transition>
				))}
			</Stack>
		</Container>
	);
}
