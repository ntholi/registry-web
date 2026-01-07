'use client';

import type { getBlockedStudentByStdNo } from '@finance/blocked-students';
import {
	Badge,
	Box,
	Button,
	Card,
	Group,
	Skeleton,
	Stack,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { getGraduationRequestByStudentNo } from '@registry/graduation/clearance';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { getAcademicHistory } from '../../_server/actions';
import CertificateDownloader from './certificate/CertificateDownloader';
import CertificatePreview from './certificate/CertificatePreview';
import TranscriptPreview from './transcript/TranscriptPreview';
import TranscriptPrinter from './transcript/TranscriptPrinter';

type GraduationViewProps = {
	stdNo: number | string;
	isActive: boolean;
	blockedStudent?: Awaited<ReturnType<typeof getBlockedStudentByStdNo>>;
};

type GraduationRequest = Awaited<
	ReturnType<typeof getGraduationRequestByStudentNo>
>;

type StudentProgram = {
	status?: string;
};

export default function GraduationView({
	stdNo,
	isActive,
	blockedStudent,
}: GraduationViewProps) {
	const [activeTab, setActiveTab] = useState<string | null>('transcript');
	const [selectedProgramId, setSelectedProgramId] = useState<
		number | undefined
	>(undefined);
	const stdNoNum = Number(stdNo);

	const { data: graduationRequest, isLoading } = useQuery({
		queryKey: ['graduation-request', stdNoNum],
		queryFn: () => getGraduationRequestByStudentNo(stdNoNum),
		enabled: isActive,
	});

	const { data: student, isLoading: isStudentLoading } = useQuery({
		queryKey: ['student', stdNoNum, 'no-active-term'],
		queryFn: () => getAcademicHistory(stdNoNum, true),
		enabled: isActive,
	});

	if (isLoading || isStudentLoading) {
		return <GraduationLoading />;
	}

	const completedPrograms = (
		(student?.programs as StudentProgram[]) || []
	).filter((p) => p && p.status === 'Completed');

	return (
		<Box>
			<RequestCard request={graduationRequest} stdNo={stdNoNum} />

			{completedPrograms && completedPrograms.length > 0 && (
				<Tabs value={activeTab} onChange={setActiveTab} variant='default'>
					<TabsList>
						<TabsTab value='transcript'>Transcript</TabsTab>
						<TabsTab value='certificate'>Certificate</TabsTab>
						{activeTab === 'transcript' && (
							<Box ml='auto'>
								<TranscriptPrinter
									stdNo={stdNoNum}
									disabled={!!blockedStudent}
								/>
							</Box>
						)}
						{activeTab === 'certificate' && (
							<Box ml='auto'>
								<CertificateDownloader
									stdNo={stdNoNum}
									disabled={!!blockedStudent}
									programId={selectedProgramId}
								/>
							</Box>
						)}
					</TabsList>
					<TabsPanel value='transcript' pt='xl'>
						<TranscriptPreview
							stdNo={stdNoNum}
							isActive={isActive && activeTab === 'transcript'}
						/>
					</TabsPanel>
					<TabsPanel value='certificate' pt='xl'>
						<CertificatePreview
							stdNo={stdNoNum}
							isActive={isActive && activeTab === 'certificate'}
							onProgramSelect={setSelectedProgramId}
						/>
					</TabsPanel>
				</Tabs>
			)}
		</Box>
	);
}

function GraduationLoading() {
	return (
		<Box my='md'>
			<Card withBorder p='md'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Skeleton height={16} width={60} />
						<Skeleton height={12} width={200} />
					</Stack>
					<Skeleton height={36} width={120} />
				</Group>
			</Card>
		</Box>
	);
}

type RequestCardProps = {
	request?: GraduationRequest | null;
	stdNo: number;
};

function RequestCard({ request, stdNo }: RequestCardProps) {
	const { data: session } = useSession();

	function getGraduationStatus(req?: GraduationRequest | null) {
		const clearances = req?.graduationClearances || [];
		if (clearances.length === 0) return 'pending';

		const hasRejected = clearances.some(
			(gc) => gc.clearance.status === 'rejected'
		);
		if (hasRejected) return 'rejected';

		const allApproved = clearances.every(
			(gc) => gc.clearance.status === 'approved'
		);
		if (allApproved) return 'approved';

		return 'pending';
	}

	const status = getGraduationStatus(request);
	const isRegistryUser = ['registry', 'admin'].includes(
		session?.user?.role ?? ''
	);

	if (!request) {
		return (
			<Card withBorder p='md' mb='lg'>
				<Group justify='space-between' align='center'>
					<Stack gap={4}>
						<Text size='sm' fw={500}>
							Graduation Request
						</Text>
						<Text size='xs' c='dimmed'>
							No graduation request found. Create one to start the clearance
							process.
						</Text>
					</Stack>
					{isRegistryUser && (
						<Button
							component={Link}
							href={`/registry/graduation/requests/new?stdNo=${stdNo}`}
							leftSection={<IconPlus size={14} />}
							variant='filled'
							size='xs'
							color='blue'
						>
							Create
						</Button>
					)}
				</Group>
			</Card>
		);
	}

	return (
		<Card withBorder p='md' mb='lg'>
			<Group justify='space-between' align='center'>
				<Stack gap={4}>
					<Group gap='xs'>
						<Text size='sm' fw={500}>
							Graduation Request
						</Text>
						<Badge color={getStatusColor(status)} size='xs' variant='light'>
							{status}
						</Badge>
					</Group>
					<Text size='xs' c='dimmed'>
						{status === 'approved'
							? 'Graduation clearance completed'
							: status === 'rejected'
								? 'Graduation clearance was rejected'
								: 'Graduation clearance is pending review'}
					</Text>
				</Stack>
				<Button
					component={Link}
					href={`/registry/graduation/requests/${request.id}`}
					size='xs'
					variant='light'
					color='blue'
				>
					View Details
				</Button>
			</Group>
		</Card>
	);
}
