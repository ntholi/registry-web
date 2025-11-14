'use client';

import {
	Badge,
	Box,
	Button,
	Card,
	Group,
	Skeleton,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { getBlockedStudentByStdNo } from '@/modules/finance/features/blocked-students/server/actions';
import { getGraduationRequestByStudentNo } from '@/modules/registry/features/graduation/clearance/server/requests/actions';
import { getAcademicHistory } from '@/modules/registry/features/students/server/actions';
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
		queryKey: ['student', stdNoNum, 'no-current-term'],
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
			<RequestCard request={graduationRequest} />

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
					<Group>
						<Skeleton height={18} width={140} />
						<Skeleton height={12} width={80} />
					</Group>
					<Group>
						<Skeleton height={28} width={96} />
					</Group>
				</Group>
			</Card>
		</Box>
	);
}

function RequestCard({ request }: { request?: GraduationRequest | null }) {
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'approved':
				return 'green';
			case 'rejected':
				return 'red';
			case 'pending':
				return 'yellow';
			default:
				return 'gray';
		}
	}

	const status = getGraduationStatus(request);

	if (!request) {
		return (
			<Card withBorder p='md' mb='lg'>
				<Text size='sm' fw={500}>
					No graduation request
				</Text>
			</Card>
		);
	}

	return (
		<Card withBorder p='md' mb='lg'>
			<Group justify='space-between' align='center'>
				<Group>
					<Text size='sm' fw={500}>
						Graduation status
					</Text>
					<Badge color={getStatusColor(status)} size='xs'>
						{status}
					</Badge>
				</Group>
				{request && (
					<Button
						component={Link}
						href={`/graduation/requests/${status}/${request.id}`}
						size='xs'
						variant='light'
						color='blue'
					>
						View Details
					</Button>
				)}
			</Group>
		</Card>
	);
}
