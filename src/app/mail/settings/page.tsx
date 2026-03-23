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
import { toggleableTriggers } from '../_lib/triggers';
import { getMailAccounts } from '../accounts/_server/actions';
import { getMailTriggerSettings } from './_server/actions';
import ChangePrimaryButton from './ChangePrimaryButton';
import TriggerSwitch from './TriggerSwitch';

export default async function SettingsPage() {
	const [{ items: accounts }, triggerSettings] = await Promise.all([
		getMailAccounts(1, ''),
		getMailTriggerSettings(),
	]);
	const primary = accounts.find((a) => a.isPrimary);
	const dailyLimit = Number(process.env.MAIL_DAILY_LIMIT) || 1900;

	const enabledMap = new Map(
		triggerSettings.map((s) => [s.triggerType, s.enabled])
	);

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
								<TableTh>Enabled</TableTh>
							</TableTr>
						</TableThead>
						<TableTbody>
							{toggleableTriggers.map((t) => (
								<TableTr key={t.type}>
									<TableTd>{t.label}</TableTd>
									<TableTd>{t.description}</TableTd>
									<TableTd>
										<TriggerSwitch
											triggerType={t.type}
											defaultEnabled={enabledMap.get(t.type) ?? true}
										/>
									</TableTd>
								</TableTr>
							))}
						</TableTbody>
					</Table>
				</Stack>
			</Card>
		</Stack>
	);
}
