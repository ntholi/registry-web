'use client';

import { findApplicationsByApplicant } from '@admissions/applications';
import { useApplicant } from '@apply/_lib/useApplicant';
import {
	Badge,
	Box,
	Card,
	Container,
	Group,
	Skeleton,
	Stack,
	Text,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import { IconCalendar, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import ApplyHeader from '../_components/ApplyHeader';
import { getStatusColor, getStatusLabel } from './_lib/status';

export default function MyApplicationsPage() {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const { applicant, isLoading: applicantLoading } = useApplicant();

	const { data: applications, isLoading: appsLoading } = useQuery({
		queryKey: ['my-applications', applicant?.id],
		queryFn: () => findApplicationsByApplicant(applicant!.id),
		enabled: !!applicant?.id,
	});

	const isLoading = applicantLoading || appsLoading;

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<ApplyHeader />
			<Container size='lg' py='xl' pt={100}>
				<Stack gap='xl'>
					<Stack gap='xs'>
						<Title order={1}>My Applications</Title>
						<Text c='dimmed'>View and manage your applications</Text>
					</Stack>

					{isLoading && (
						<Stack gap='md'>
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} h={120} radius='md' />
							))}
						</Stack>
					)}

					{!isLoading && (!applications || applications.length === 0) && (
						<Card withBorder radius='md' p='xl' ta='center'>
							<Stack gap='sm' align='center'>
								<IconSchool size={48} color='var(--mantine-color-dimmed)' />
								<Text c='dimmed'>You have no applications yet</Text>
								<Text
									component={Link}
									href='/apply/new'
									c='blue'
									td='underline'
								>
									Start a new application
								</Text>
							</Stack>
						</Card>
					)}

					{!isLoading && applications && applications.length > 0 && (
						<Stack gap='md'>
							{applications.map((application) => (
								<ApplicationCard
									key={application.id}
									application={application}
								/>
							))}
						</Stack>
					)}
				</Stack>
			</Container>
		</Box>
	);
}

type Application = Awaited<
	ReturnType<typeof findApplicationsByApplicant>
>[number];

interface ApplicationCardProps {
	application: Application;
}

function ApplicationCard({ application }: ApplicationCardProps) {
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
