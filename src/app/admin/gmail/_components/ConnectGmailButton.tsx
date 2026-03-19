'use client';

import {
	Alert,
	Badge,
	Button,
	Group,
	Loader,
	Stack,
	Text,
} from '@mantine/core';
import { IconBrandGoogle, IconCheck, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { checkGmailConnection } from '../_server/actions';

export default function ConnectGmailButton() {
	const { data, isLoading } = useQuery({
		queryKey: ['gmail-connection'],
		queryFn: checkGmailConnection,
	});

	if (isLoading) {
		return <Loader size='sm' />;
	}

	if (data?.connected) {
		return (
			<Alert
				variant='light'
				color='green'
				icon={<IconCheck size={16} />}
				maw={480}
			>
				<Stack gap='xs'>
					<Group gap='xs'>
						<Text size='sm' fw={500}>
							Gmail Connected
						</Text>
						<Badge color='green' variant='light' size='sm'>
							Active
						</Badge>
					</Group>
					{data.email && (
						<Text size='sm' c='dimmed'>
							{data.email}
						</Text>
					)}
					<Button
						component='a'
						href='/api/auth/google-gmail?state=/admin/gmail'
						variant='subtle'
						color='green'
						size='xs'
						leftSection={<IconRefresh size={14} />}
					>
						Reconnect
					</Button>
				</Stack>
			</Alert>
		);
	}

	return (
		<Button
			component='a'
			href='/api/auth/google-gmail?state=/admin/gmail'
			variant='filled'
			leftSection={<IconBrandGoogle size={16} />}
		>
			Connect Gmail
		</Button>
	);
}
