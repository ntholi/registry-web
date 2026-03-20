import {
	Badge,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import { getMailAccounts } from '../accounts/_server/actions';
import ChangePrimaryButton from './ChangePrimaryButton';

export default async function SettingsPage() {
	const { items: accounts } = await getMailAccounts(1, '');
	const primary = accounts.find((a) => a.isPrimary);

	return (
		<Stack p='xl' gap='xl'>
			<Title order={3} fw={400}>
				Mail Settings
			</Title>

			<Card withBorder>
				<Stack gap='md'>
					<Title order={5}>Primary Account</Title>
					{primary ? (
						<Group justify='space-between'>
							<Stack gap={2}>
								<Text size='sm' fw={500}>
									{primary.email}
								</Text>
								<Text size='xs' c='dimmed'>
									{primary.displayName || 'No display name'}
								</Text>
								<Badge size='xs' variant='light' color='green'>
									Active
								</Badge>
							</Stack>
							<ChangePrimaryButton accounts={accounts} currentId={primary.id} />
						</Group>
					) : (
						<Group justify='space-between'>
							<Text size='sm' c='dimmed'>
								No primary account configured
							</Text>
							{accounts.length > 0 && (
								<ChangePrimaryButton accounts={accounts} currentId={null} />
							)}
						</Group>
					)}
				</Stack>
			</Card>

			<Card withBorder>
				<Stack gap='md'>
					<Title order={5}>Queue Configuration</Title>
					<SimpleGrid cols={{ base: 1, sm: 3 }}>
						<Stack gap={2}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								Max Retries
							</Text>
							<Text size='sm' fw={500}>
								3
							</Text>
						</Stack>
						<Stack gap={2}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								Daily Quota
							</Text>
							<Text size='sm' fw={500}>
								2,000
							</Text>
						</Stack>
						<Stack gap={2}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								Retry Strategy
							</Text>
							<Text size='sm' fw={500}>
								Exponential Backoff
							</Text>
						</Stack>
					</SimpleGrid>
				</Stack>
			</Card>

			<Card withBorder>
				<Stack gap='md'>
					<Title order={5}>System Email Triggers</Title>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Trigger</Table.Th>
								<Table.Th>Description</Table.Th>
								<Table.Th>Status</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>Student Status Created</Table.Td>
								<Table.Td>
									Email sent when student submits status request
								</Table.Td>
								<Table.Td>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>Student Status Updated</Table.Td>
								<Table.Td>
									Email sent when student updates status request
								</Table.Td>
								<Table.Td>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>Student Status Approved</Table.Td>
								<Table.Td>Email sent when approver approves status</Table.Td>
								<Table.Td>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>Student Status Rejected</Table.Td>
								<Table.Td>Email sent when approver rejects status</Table.Td>
								<Table.Td>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</Table.Td>
							</Table.Tr>
							<Table.Tr>
								<Table.Td>Notification Mirror</Table.Td>
								<Table.Td>In-app notifications mirrored as email</Table.Td>
								<Table.Td>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Stack>
			</Card>
		</Stack>
	);
}
