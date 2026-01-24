'use client';

import type { findApplicationsByApplicant } from '@admissions/applications';
import { Badge, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCalendar, IconSchool } from '@tabler/icons-react';
import Link from 'next/link';
import { getStatusColor, getStatusLabel } from '../_lib/status';

type Application = Awaited<
	ReturnType<typeof findApplicationsByApplicant>
>[number];

interface Props {
	applications: Application[];
}

export function ApplicationsTab({ applications }: Props) {
	if (applications.length === 0) {
		return (
			<Stack align='center' py='xl'>
				<IconSchool size={48} color='var(--mantine-color-dimmed)' />
				<Text c='dimmed'>No applications yet</Text>
				<Text component={Link} href='/apply/new' c='blue' td='underline'>
					Start a new application
				</Text>
			</Stack>
		);
	}

	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
			{applications.map((application) => (
				<ApplicationCard key={application.id} application={application} />
			))}
		</SimpleGrid>
	);
}

function ApplicationCard({ application }: { application: Application }) {
	return (
		<Card
			component={Link}
			href={`/apply/${application.id}/review`}
			withBorder
			radius='md'
			p='lg'
			style={{ cursor: 'pointer' }}
		>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start'>
					<Stack gap={4}>
						<Text fw={600} size='lg'>
							{application.firstChoiceProgram.name}
						</Text>
						<Group gap='xs'>
							<IconSchool size={14} />
							<Text size='sm' c='dimmed'>
								{application.firstChoiceProgram.school?.shortName ??
									application.firstChoiceProgram.code}
							</Text>
						</Group>
					</Stack>
					<Badge color={getStatusColor(application.status)} variant='light'>
						{getStatusLabel(application.status)}
					</Badge>
				</Group>

				{application.secondChoiceProgram && (
					<Text size='sm' c='dimmed'>
						Second Choice: {application.secondChoiceProgram.name}
					</Text>
				)}

				<Group gap='xs'>
					<IconCalendar size={14} />
					<Text size='sm' c='dimmed'>
						{application.intakePeriod.name}
					</Text>
				</Group>
			</Stack>
		</Card>
	);
}
