import {
	Badge,
	Box,
	Container,
	Flex,
	Group,
	Paper,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { getRegistrationRequest } from '@registry/registration/requests';
import { IconBooks, IconEdit } from '@tabler/icons-react';
import { forbidden, notFound } from 'next/navigation';
import { config } from '@/config';
import { auth } from '@/core/auth';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getStatusIcon } from '@/shared/lib/utils/status';
import { formatSemester } from '@/shared/lib/utils/utils';
import ButtonLink from '@/shared/ui/ButtonLink';
import {
	ClearanceStatusView,
	DepartmentMessagesView,
	ModulesView,
	ProofOfRegistrationDownload,
} from '../_components';
import { getRegistrationOverallClearanceStatus as getOverallClearanceStatus } from '../_lib/status';

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export default async function page({ params }: Props) {
	const session = await auth();

	if (!session?.user?.stdNo) {
		return forbidden();
	}

	const { id } = await params;
	const registration = await getRegistrationRequest(Number(id));

	if (!registration) {
		return notFound();
	}

	if (registration.stdNo !== session.user.stdNo) {
		return forbidden();
	}

	const clearanceStatus = getOverallClearanceStatus(registration);

	return (
		<Container size='md' px='xs'>
			<Stack gap='xl'>
				<Paper withBorder p='md'>
					<Box>
						<Group justify='space-between' align='flex-start' wrap='wrap'>
							<Title order={1} size='h2' fw={600} mb='xs'>
								Registration
							</Title>
							<Badge
								radius='xs'
								color={getStatusColor(clearanceStatus)}
								variant='light'
							>
								{clearanceStatus}
							</Badge>
						</Group>

						<Flex justify={'space-between'} align={'center'}>
							<Text c='dimmed' size='sm'>
								{registration.term.code} •{' '}
								{formatSemester(registration.semesterNumber)}
							</Text>
							{registration.status === 'pending' &&
								registration.count <=
									config.registry.maxRegistrationAttempts && (
									<ButtonLink
										href={`/student-portal/registration/${registration.id}/edit`}
										variant='subtle'
										mr={-10}
										size='xs'
										leftSection={<IconEdit size={16} />}
									>
										Update
									</ButtonLink>
								)}
							{registration.status === 'registered' && (
								<ProofOfRegistrationDownload
									stdNo={registration.stdNo}
									termCode={registration.term.code}
									semesterNumber={registration.semesterNumber}
								/>
							)}
						</Flex>

						<DepartmentMessagesView registration={registration} />
					</Box>
				</Paper>

				<Tabs defaultValue='modules' variant='outline'>
					<TabsList>
						<TabsTab value='modules' leftSection={<IconBooks size='1rem' />}>
							Modules ({registration.requestedModules.length})
						</TabsTab>
						<TabsTab
							value='clearance'
							leftSection={
								<ThemeIcon
									color={getStatusColor(clearanceStatus)}
									variant='light'
									radius={'xl'}
									size={20}
								>
									{getStatusIcon(clearanceStatus)}
								</ThemeIcon>
							}
						>
							Clearance Status
						</TabsTab>
					</TabsList>

					<TabsPanel value='modules'>
						<Box mt='md'>
							<ModulesView registration={registration} />
						</Box>
					</TabsPanel>

					<TabsPanel value='clearance'>
						<Box mt='md'>
							<ClearanceStatusView registration={registration} />
						</Box>
					</TabsPanel>
				</Tabs>
			</Stack>
		</Container>
	);
}
