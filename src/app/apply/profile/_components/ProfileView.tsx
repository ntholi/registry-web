'use client';

import type { ApplicantWithRelations } from '@admissions/applicants';
import { findApplicationsByApplicant } from '@admissions/applications';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Container,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Tabs,
	Text,
	useMantineColorScheme,
} from '@mantine/core';
import {
	IconArrowRight,
	IconCreditCard,
	IconFileText,
	IconGridDots,
	IconUser,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ApplyHeader from '../../_components/ApplyHeader';
import { getOverallStatusColor, getOverallStatusSummary } from '../_lib/status';
import { ApplicationsTab } from './ApplicationsTab';
import { DocumentsTab } from './DocumentsTab';
import { InfoTab } from './InfoTab';

interface Props {
	applicant: ApplicantWithRelations;
}

export function ProfileView({ applicant }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const { data: session } = useSession();
	const [activeTab, setActiveTab] = useState<string | null>('applications');

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

	const primaryApp = applications?.[0];
	const statusSummary = primaryApp
		? getOverallStatusSummary(primaryApp.status, primaryApp.paymentStatus, {
				bankDeposits: primaryApp.bankDeposits,
				mobileDeposits: primaryApp.mobileDeposits,
			})
		: 'No applications yet';
	const statusColor = primaryApp
		? getOverallStatusColor(primaryApp.status, primaryApp.paymentStatus, {
				bankDeposits: primaryApp.bankDeposits,
				mobileDeposits: primaryApp.mobileDeposits,
			})
		: 'gray';

	const showPaymentButton =
		primaryApp?.status === 'submitted' &&
		primaryApp.paymentStatus === 'unpaid' &&
		primaryApp.bankDeposits.length === 0 &&
		primaryApp.mobileDeposits.length === 0;

	const showContinueButton = primaryApp?.status === 'draft';

	return (
		<Box mih='100vh'>
			<ApplyHeader />
			<Container size='md' py='xl' pt={120}>
				<Stack gap={'xl'}>
					{/* Profile Header */}
					<Group align='flex-start' gap={60} wrap='nowrap' visibleFrom='sm'>
						<Avatar
							size={150}
							radius={150}
							color='blue'
							src={session?.user?.image}
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

						<Stack gap='md' style={{ flex: 1 }}>
							<Stack gap={4}>
								<Group justify='space-between' align='center'>
									<Text size='24px' fw={300}>
										{applicant.fullName || 'Applicant'}
									</Text>
									<ProfileActionButton
										app={primaryApp}
										showPayment={showPaymentButton}
										showContinue={showContinueButton}
									/>
								</Group>
								<Text c={statusColor} variant='light' size='sm'>
									{statusSummary}
								</Text>
							</Stack>

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
						</Stack>
					</Group>

					{/* Mobile Header */}
					<Stack gap='lg' hiddenFrom='sm'>
						<Group gap='xl'>
							<Avatar
								size={80}
								src={session?.user?.image}
								radius={80}
								color='blue'
							>
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

						<Stack gap={6}>
							<Group justify='space-between' align='center'>
								<Text fw={700} size='sm'>
									{applicant.fullName || 'Applicant'}
								</Text>
								<ProfileActionButton
									app={primaryApp}
									showPayment={showPaymentButton}
									showContinue={showContinueButton}
									compact
								/>
							</Group>
							<Alert variant='light' color={statusColor} mt='sm' title='Status'>
								{statusSummary}
							</Alert>
						</Stack>
					</Stack>

					{/* Tabs */}
					<Tabs
						value={activeTab}
						onChange={setActiveTab}
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
								style={{
									borderTopColor:
										activeTab === 'applications'
											? isDark
												? 'white'
												: 'black'
											: 'transparent',
									color:
										activeTab === 'applications'
											? isDark
												? 'white'
												: 'black'
											: undefined,
								}}
							>
								Applications
							</Tabs.Tab>
							<Tabs.Tab
								value='info'
								leftSection={<IconUser size={14} />}
								style={{
									borderTopColor:
										activeTab === 'info'
											? isDark
												? 'white'
												: 'black'
											: 'transparent',
									color:
										activeTab === 'info'
											? isDark
												? 'white'
												: 'black'
											: undefined,
								}}
							>
								Info
							</Tabs.Tab>
							<Tabs.Tab
								value='documents'
								leftSection={<IconFileText size={14} />}
								style={{
									borderTopColor:
										activeTab === 'documents'
											? isDark
												? 'white'
												: 'black'
											: 'transparent',
									color:
										activeTab === 'documents'
											? isDark
												? 'white'
												: 'black'
											: undefined,
								}}
							>
								Docs
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

type ActionButtonProps = {
	app:
		| {
				id: string;
				status: string;
		  }
		| undefined;
	showPayment: boolean;
	showContinue: boolean;
	compact?: boolean;
};

function ProfileActionButton({
	app,
	showPayment,
	showContinue,
	compact,
}: ActionButtonProps) {
	if (!app) return null;

	if (showContinue) {
		return (
			<Button
				component={Link}
				href={`/apply/${app.id}/identity`}
				size={compact ? 'xs' : 'sm'}
				variant='light'
				rightSection={<IconArrowRight size={14} />}
			>
				Continue Application
			</Button>
		);
	}

	if (showPayment) {
		return (
			<Button
				component={Link}
				href={`/apply/${app.id}/payment?method=receipt`}
				size={compact ? 'xs' : 'sm'}
				variant='filled'
				rightSection={<IconCreditCard size={14} />}
			>
				Submit Payment
			</Button>
		);
	}

	return null;
}
