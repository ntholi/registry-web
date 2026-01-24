'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	Avatar,
	Box,
	Container,
	Group,
	SimpleGrid,
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
		<Box mih='100vh'>
			<ApplyHeader />
			<Container size='md' py='xl' pt={120}>
				<Stack gap={40}>
					{/* Profile Header */}
					<Group align='flex-start' gap={60} wrap='nowrap' visibleFrom='sm'>
						<Avatar
							size={150}
							radius={150}
							color='blue'
							style={{
								border: `1px solid ${
									isDark
										? 'var(--mantine-color-dark-4)'
										: 'var(--mantine-color-gray-3)'
								}`,
								padding: '4px',
							}}
						>
							{initials}
						</Avatar>

						<Stack gap='xl' style={{ flex: 1 }}>
							<Group justify='space-between' align='center'>
								<Text size='24px' fw={300}>
									{applicant.fullName || 'Applicant'}
								</Text>
							</Group>

							<Group gap={40}>
								<Group gap={6}>
									<Text fw={600}>{appCount}</Text>
									<Text size='sm' c='dimmed'>
										applications
									</Text>
								</Group>
								<Group gap={6}>
									<Text fw={600}>{docCount}</Text>
									<Text size='sm' c='dimmed'>
										documents
									</Text>
								</Group>
							</Group>

							<Box>
								<Text fw={600} size='sm'>
									Limkokwing University Applicant
								</Text>
								<Text size='sm' c='dimmed'>
									Future Professional
								</Text>
							</Box>
						</Stack>
					</Group>

					{/* Mobile Header */}
					<Stack gap='lg' hiddenFrom='sm'>
						<Group gap='xl'>
							<Avatar size={80} radius={80} color='blue'>
								{initials}
							</Avatar>
							<Group gap={20} grow style={{ flex: 1 }}>
								<Stack gap={0} align='center'>
									<Text fw={700}>{appCount}</Text>
									<Text size='xs' c='dimmed'>
										applications
									</Text>
								</Stack>
								<Stack gap={0} align='center'>
									<Text fw={700}>{docCount}</Text>
									<Text size='xs' c='dimmed'>
										documents
									</Text>
								</Stack>
							</Group>
						</Group>

						<Box>
							<Text fw={700} size='sm'>
								{applicant.fullName || 'Applicant'}
							</Text>
							<Text size='xs' c='dimmed'>
								Limkokwing University Applicant
							</Text>
						</Box>
					</Stack>

					{/* Tabs */}
					<Tabs
						defaultValue='applications'
						variant='default'
						styles={(theme) => ({
							root: {
								borderTop: `1px solid ${
									isDark ? theme.colors.dark[4] : theme.colors.gray[3]
								}`,
							},
							list: {
								borderBottom: 'none',
								justifyContent: 'center',
								gap: '40px',
								marginTop: '-1px',
							},
							tab: {
								borderTop: '1px solid transparent',
								borderRadius: 0,
								padding: '12px 0',
								backgroundColor: 'transparent',
								'&[data-active]': {
									borderTopColor: isDark ? 'white' : 'black',
									color: isDark ? 'white' : 'black',
								},
								'&:hover': {
									backgroundColor: 'transparent',
									borderTopColor: isDark
										? theme.colors.dark[4]
										: theme.colors.gray[3],
								},
							},
							tabLabel: {
								fontSize: '12px',
								fontWeight: 600,
								textTransform: 'uppercase',
								letterSpacing: '1px',
							},
						})}
					>
						<Tabs.List>
							<Tabs.Tab
								value='applications'
								leftSection={<IconGridDots size={14} />}
							>
								Applications
							</Tabs.Tab>
							<Tabs.Tab value='info' leftSection={<IconUser size={14} />}>
								Info
							</Tabs.Tab>
							<Tabs.Tab
								value='documents'
								leftSection={<IconFileText size={14} />}
							>
								Documents
							</Tabs.Tab>
						</Tabs.List>

						<Box mt={30}>
							<Tabs.Panel value='applications'>
								{isLoading ? (
									<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
										{[1, 2].map((i) => (
											<Skeleton key={i} h={150} radius='md' />
										))}
									</SimpleGrid>
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
