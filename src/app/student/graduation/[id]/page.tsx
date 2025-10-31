import {
	Badge,
	Box,
	Container,
	Divider,
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
import { IconReceipt } from '@tabler/icons-react';
import { forbidden, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { formatDateTime } from '@/lib/utils';
import { getGraduationRequest } from '@/server/graduation/requests/actions';
import {
	getClearanceStatus,
	getGraduationStatus,
	getStatusColor,
	getStatusIcon,
} from '../../utils/status';
import ProofOfClearanceDownload from '../components/ProofOfClearanceDownload';
import GraduationClearanceView from './GraduationClearanceView';
import PaymentReceiptsView from './PaymentReceiptsView';

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export default async function GraduationDetailsPage({ params }: Props) {
	const session = await auth();

	if (!session?.user?.stdNo) {
		return forbidden();
	}

	const { id } = await params;
	const graduationRequest = await getGraduationRequest(Number(id));

	if (!graduationRequest) {
		return notFound();
	}

	if (graduationRequest.studentProgram.stdNo !== session.user.stdNo) {
		return forbidden();
	}

	const status = getGraduationStatus(graduationRequest);
	const clearanceStatus = getClearanceStatus(graduationRequest.graduationClearances);

	return (
		<Container size='md' px='xs'>
			<Stack gap='xl'>
				<Paper withBorder p='md'>
					<Box>
						<Group justify='space-between' align='flex-start' wrap='wrap'>
							<Title order={1} size='h2' fw={600} mb='xs'>
								Graduation
							</Title>
							<Badge radius='xs' color={getStatusColor(status)} variant='light'>
								{status}
							</Badge>
						</Group>

						<Flex justify={'space-between'} wrap='wrap'>
							<Box mb='md'>
								<Text size='sm'>{graduationRequest.studentProgram.structure.program.name}</Text>

								<Text c='dimmed' size='sm'>
									Submitted: {formatDateTime(graduationRequest.createdAt!)}
								</Text>
							</Box>
							{clearanceStatus === 'approved' && (
								<ProofOfClearanceDownload
									graduationRequestId={graduationRequest.id}
									studentNumber={graduationRequest.studentProgram.stdNo}
								/>
							)}
						</Flex>

						{graduationRequest.message && (
							<>
								<Divider my='md' />
								<Box>
									<Text size='xs' c='dimmed' fw={500} tt='uppercase' mb='xs'>
										Message
									</Text>
									<Paper withBorder bg='var(--mantine-color-gray-light)' p='sm'>
										<Text size='sm'>{graduationRequest.message}</Text>
									</Paper>
								</Box>
							</>
						)}
					</Box>
				</Paper>

				<Tabs defaultValue='clearance' variant='outline'>
					<TabsList>
						<TabsTab
							value='clearance'
							leftSection={
								<ThemeIcon color={getStatusColor(clearanceStatus)} variant='light' size={20}>
									{getStatusIcon(clearanceStatus)}
								</ThemeIcon>
							}
						>
							Clearance Status
						</TabsTab>
						<TabsTab value='payments' leftSection={<IconReceipt size='1rem' />}>
							Payment Receipts ({graduationRequest.paymentReceipts?.length || 0})
						</TabsTab>
					</TabsList>

					<TabsPanel value='clearance'>
						<Box mt='md'>
							<GraduationClearanceView graduationRequest={graduationRequest} />
						</Box>
					</TabsPanel>

					<TabsPanel value='payments'>
						<Box mt='md'>
							<PaymentReceiptsView graduationRequest={graduationRequest} />
						</Box>
					</TabsPanel>
				</Tabs>
			</Stack>
		</Container>
	);
}
