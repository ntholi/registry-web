'use client';

import { Card, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getTermSettings } from '../_server/settings-actions';
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

			<Card withBorder padding='md'>
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

					<Divider />

					<Stack gap='xs'>
						<Text fw={500}>Registration Period</Text>
						<RegistrationDates
							termId={termId}
							startDate={settings?.registrationStartDate ?? null}
							endDate={settings?.registrationEndDate ?? null}
						/>
					</Stack>
				</Stack>
			</Card>

			<Title order={4}>Actions</Title>

			<Card withBorder padding='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={2}>
						<Text fw={500}>Move Rejected to Blocked</Text>
						<Text size='sm' c='dimmed'>
							Transfer students with rejected registration clearances to blocked
							students
						</Text>
					</Stack>
					<MoveRejectedButton termId={termId} termCode={termCode} />
				</Group>
			</Card>
		</Stack>
	);
}
