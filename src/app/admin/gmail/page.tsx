import { Center, Paper, Stack, Text, Title } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import ConnectGmailButton from './_components/ConnectGmailButton';

export default function GmailPage() {
	return (
		<Center h='60vh'>
			<Paper p='xl' withBorder maw={500} w='100%'>
				<Stack align='center' gap='lg'>
					<IconMail size={64} stroke={1.5} color='var(--mantine-color-blue-6)' />
					<Stack align='center' gap='xs'>
						<Title order={2} fw='normal'>
							Gmail Account
						</Title>
						<Text size='sm' c='dimmed' ta='center'>
							Connect your Gmail account to send and manage emails directly from
							the portal.
						</Text>
					</Stack>
					<ConnectGmailButton />
				</Stack>
			</Paper>
		</Center>
	);
}
