'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	Avatar,
	Box,
	Container,
	Group,
	Paper,
	Skeleton,
	Stack,
	Tabs,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import { IconFileText, IconGridDots, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import ApplyHeader from '../../_components/ApplyHeader';
import { ApplicationsTab } from './ApplicationsTab';
import { DocumentsTab } from './DocumentsTab';
import { InfoTab } from './InfoTab';

interface Props {
	applicant: ApplicantWithRelations;
}

export function ProfileView({ applicant }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';

	const { data: applications, isLoading } = useQuery({
		queryKey: ['my-applications', applicant.id],
		queryFn: () => findApplicationsByApplicant(applicant.id),
	});

	const initials = applicant.fullName
		? applicant.fullName
				.split(' ')
				.map((n) => n[0])
				.join('')
				.slice(0, 2)
				.toUpperCase()
		: '?';

	const appCount = applications?.length ?? 0;
	const docCount = applicant.documents.length;

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<ApplyHeader />
			<Container size='md' py='xl' pt={100}>
				<Stack gap='xl'>
					<Paper withBorder radius='md' p='xl'>
						<Stack gap='lg'>
							<Group justify='center'>
								<Avatar size={120} radius={120} color='blue'>
									{initials}
								</Avatar>
							</Group>

							<Stack gap={4} align='center'>
								<Text size='xl' fw={700}>
									{applicant.fullName || 'Applicant'}
								</Text>
							</Stack>

							<Group justify='center' gap='xl'>
								<Stack gap={2} align='center'>
									<Text size='xl' fw={700}>
										{appCount}
									</Text>
									<Text size='xs' c='dimmed'>
										Applications
									</Text>
								</Stack>
								<Stack gap={2} align='center'>
									<Text size='xl' fw={700}>
										{docCount}
									</Text>
									<Text size='xs' c='dimmed'>
										Documents
									</Text>
								</Stack>
							</Group>
						</Stack>
					</Paper>

					<Tabs defaultValue='applications' variant='default'>
						<Tabs.List grow justify='center'>
							<Tabs.Tab
								value='applications'
								leftSection={<IconGridDots size={16} />}
							>
								Applications
							</Tabs.Tab>
							<Tabs.Tab value='info' leftSection={<IconUser size={16} />}>
								Info
							</Tabs.Tab>
							<Tabs.Tab
								value='documents'
								leftSection={<IconFileText size={16} />}
							>
								Documents
							</Tabs.Tab>
						</Tabs.List>

						<Box mt='lg'>
							<Tabs.Panel value='applications'>
								{isLoading ? (
									<Stack gap='md'>
										{[1, 2].map((i) => (
											<Skeleton key={i} h={120} radius='md' />
										))}
									</Stack>
								) : (
									<ApplicationsTab applications={applications ?? []} />
								)}
							</Tabs.Panel>

							<Tabs.Panel value='info'>
								<InfoTab applicant={applicant} />
							</Tabs.Panel>

							<Tabs.Panel value='documents'>
								<DocumentsTab applicant={applicant} />
							</Tabs.Panel>
						</Box>
					</Tabs>
				</Stack>
			</Container>
		</Box>
	);
}
