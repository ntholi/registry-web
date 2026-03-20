import {
	Badge,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
	Title,
} from '@mantine/core';
import { getMailAccounts } from '../accounts/_server/actions';
import ChangePrimaryButton from './ChangePrimaryButton';

export default async function SettingsPage() {
	const { items: accounts } = await getMailAccounts(1, '');
	const primary = accounts.find((a) => a.isPrimary);
	const dailyLimit = Number(process.env.MAIL_DAILY_LIMIT) || 1900;

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
								{dailyLimit.toLocaleString()}
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
						<TableThead>
							<TableTr>
								<TableTh>Trigger</TableTh>
								<TableTh>Description</TableTh>
								<TableTh>Status</TableTh>
							</TableTr>
						</TableThead>
						<TableTbody>
							<TableTr>
								<TableTd>Student Status Created</TableTd>
								<TableTd>
									Email sent when student submits status request
								</TableTd>
								<TableTd>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</TableTd>
							</TableTr>
							<TableTr>
								<TableTd>Student Status Updated</TableTd>
								<TableTd>
									Email sent when student updates status request
								</TableTd>
								<TableTd>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</TableTd>
							</TableTr>
							<TableTr>
								<TableTd>Student Status Approved</TableTd>
								<TableTd>Email sent when approver approves status</TableTd>
								<TableTd>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</TableTd>
							</TableTr>
							<TableTr>
								<TableTd>Student Status Rejected</TableTd>
								<TableTd>Email sent when approver rejects status</TableTd>
								<TableTd>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</TableTd>
							</TableTr>
							<TableTr>
								<TableTd>Notification Mirror</TableTd>
								<TableTd>In-app notifications mirrored as email</TableTd>
								<TableTd>
									<Badge size='xs' variant='light' color='green'>
										Active
									</Badge>
								</TableTd>
							</TableTr>
						</TableTbody>
					</Table>
				</Stack>
			</Card>
		</Stack>
	);
}
