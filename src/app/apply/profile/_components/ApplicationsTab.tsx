'use client';

import type { findApplicationsByApplicant } from '@admissions/applications';
import {
	Badge,
	Box,
	Card,
	Group,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
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
	const programLabel =
		application.firstChoiceProgram?.name ?? 'Program not selected';
	const schoolLabel =
		application.firstChoiceProgram?.school?.shortName ??
		application.firstChoiceProgram?.code ??
		'Select a program';

	return (
		<Card
			component={Link}
			href={`/apply/${application.id}/review`}
			withBorder
			p={0}
		>
			<Stack gap='md' p='lg'>
				<Stack gap={4} style={{ flex: 1 }}>
					<Box pos={'relative'}>
						<Text size='lg' lineClamp={1}>
							{programLabel}
						</Text>
						<Badge
							pos='absolute'
							top={-8}
							right={-8}
							color={getStatusColor(application.status)}
							variant='light'
							size='sm'
							radius='xs'
						>
							{getStatusLabel(application.status)}
						</Badge>
					</Box>
					<Group gap='xs'>
						<IconSchool size={16} color='var(--mantine-color-dimmed)' />
						<Text size='sm' c='dimmed' fw={500}>
							{schoolLabel}
						</Text>
					</Group>
				</Stack>

				<Group justify='space-between' align='flex-end' mt='xs'>
					<Group gap='xs'>
						<IconCalendar size={16} color='var(--mantine-color-dimmed)' />
						<Text size='xs' c='dimmed'>
							{application.intakePeriod.name}
						</Text>
					</Group>
					<Text size='xs' c='dimmed' fw={500}>
						ID: {application.id.slice(0, 8)}
					</Text>
				</Group>
			</Stack>
		</Card>
	);
}
