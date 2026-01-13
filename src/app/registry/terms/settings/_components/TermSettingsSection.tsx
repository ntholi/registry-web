'use client';

import {
	Card,
	Divider,
	Group,
	Paper,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getTermSettings } from '../_server/actions';
import GradebookAccessButton from './GradebookAccessButton';
import MoveRejectedButton from './MoveRejectedButton';
import PublishResultsButton from './PublishResultsButton';
import RegistrationDates from './RegistrationDates';

interface Props {
	termId: number;
	termCode: string;
}

export default function TermSettingsSection({ termId, termCode }: Props) {
	const { data: settings } = useQuery({
		queryKey: ['term-settings', termId],
		queryFn: () => getTermSettings(termId),
	});

	return (
		<Stack gap='lg' mt='xl'>
			<Title order={4}>Settings</Title>

			<Tabs defaultValue='results-publication'>
				<Tabs.List>
					<Tabs.Tab value='results-publication'>Results Publication</Tabs.Tab>
					<Tabs.Tab value='registration'>Registration</Tabs.Tab>
					<Tabs.Tab value='actions'>Actions</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='results-publication' pt='md'>
					<Paper withBorder p='md'>
						<Stack gap='md'>
							<Group justify='space-between' align='center'>
								<Stack gap={2}>
									<Text fw={500}>Results</Text>
									<Text size='xs' c='dimmed'>
										Control student access to grades and CGPA for this term
									</Text>
								</Stack>
								<PublishResultsButton
									termId={termId}
									termCode={termCode}
									isPublished={settings?.resultsPublished ?? false}
								/>
							</Group>

							<Divider />

							<Group justify='space-between' align='center'>
								<Stack gap={2}>
									<Text fw={500}>Lecturer Gradebook</Text>
									<Text size='xs' c='dimmed'>
										Control lecturer access to enter and edit grades
									</Text>
								</Stack>
								<GradebookAccessButton
									termId={termId}
									access={settings?.lecturerGradebookAccess ?? true}
								/>
							</Group>
						</Stack>
					</Paper>
				</Tabs.Panel>

				<Tabs.Panel value='registration' pt='md'>
					<Paper withBorder p='md'>
						<Stack gap='xs'>
							<Text fw={500}>Registration Period</Text>
							<Text size='xs' c='dimmed'>
								Set the window when students can register for this term
							</Text>
							<RegistrationDates
								termId={termId}
								startDate={settings?.registrationStartDate ?? null}
								endDate={settings?.registrationEndDate ?? null}
							/>
						</Stack>
					</Paper>
				</Tabs.Panel>

				<Tabs.Panel value='actions' pt='md'>
					<Card withBorder padding='md'>
						<Group justify='space-between' align='center'>
							<Stack gap={2}>
								<Text fw={500}>Move Rejected to Blocked</Text>
								<Text size='sm' c='dimmed'>
									Transfer students with rejected registration clearances to
									blocked students
								</Text>
							</Stack>
							<MoveRejectedButton termId={termId} termCode={termCode} />
						</Group>
					</Card>
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
