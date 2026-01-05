'use client';

import { updateStudentSemester } from '@audit-logs/student-semesters';
import { getSponsor, getStudentSponsors } from '@finance/sponsors';
import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Group,
	Modal,
	Paper,
	Select,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconEdit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getStudentRegistrationData } from '../../_server/actions';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

type StudentData = Awaited<ReturnType<typeof getStudentRegistrationData>>;
type Program = NonNullable<StudentData>['programs'][number];
type Semester = Program['semesters'][number];

const ALLOWED_ROLES = ['registry', 'admin', 'finance'];

export default function SemesterSponsorsView({
	stdNo,
	isActive = true,
}: Props) {
	const { data: session } = useSession();
	const canEdit = ALLOWED_ROLES.includes(session?.user?.role || '');

	const { data, isLoading, error } = useQuery({
		queryKey: ['student-registration-data', stdNo],
		queryFn: () => getStudentRegistrationData(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return <LoadingSkeleton />;
	}

	if (error) {
		return (
			<Alert color='red' title='Error'>
				Failed to load semester sponsors. Please try again.
			</Alert>
		);
	}

	const activeProgram = data?.programs?.find((p) => p.status === 'Active');
	const semesters = (activeProgram?.semesters || [])
		.filter((s) => s.status === 'Active')
		.sort((a, b) => b.termCode.localeCompare(a.termCode));

	if (semesters.length === 0) {
		return (
			<Stack align='center' py='xl' gap='md'>
				<Text size='lg' fw={500} c='dimmed'>
					No semesters found
				</Text>
				<Text size='sm' c='dimmed' ta='center'>
					This student has not been registered for any semesters yet.
				</Text>
			</Stack>
		);
	}

	return (
		<Stack gap='md'>
			{semesters.map((semester) => (
				<SemesterCard
					key={semester.id}
					semester={semester}
					stdNo={stdNo}
					canEdit={canEdit}
				/>
			))}
		</Stack>
	);
}

type SemesterCardProps = {
	semester: Semester;
	stdNo: number;
	canEdit: boolean;
};

function SemesterCard({ semester, stdNo, canEdit }: SemesterCardProps) {
	const semesterNumber = semester.structureSemester?.semesterNumber || '1';
	const moduleCount = semester.studentModules?.length || 0;
	const totalCredits =
		semester.studentModules?.reduce((sum, m) => sum + (m.credits || 0), 0) || 0;

	const { data: sponsor } = useQuery({
		queryKey: ['sponsor', semester.sponsorId],
		queryFn: () => (semester.sponsorId ? getSponsor(semester.sponsorId) : null),
		enabled: !!semester.sponsorId,
	});

	return (
		<Paper withBorder p='md'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap={4}>
					<Group gap='xs'>
						<Text fw={500} size='sm'>
							{semester.termCode}
						</Text>
					</Group>
					<Text size='xs' c='dimmed'>
						{formatSemester(semesterNumber)}
					</Text>
					<Text size='xs' c='dimmed'>
						{moduleCount} module{moduleCount !== 1 ? 's' : ''} • {totalCredits}{' '}
						credits
					</Text>
				</Stack>
				<Group gap='sm' align='flex-start'>
					<Stack gap={4} align='flex-end'>
						{sponsor ? (
							<>
								<Text size='xs' c='dimmed'>
									Sponsor
								</Text>
								<Badge variant='light' color='blue'>
									{sponsor.name}
								</Badge>
							</>
						) : (
							<Text size='xs' c='dimmed' fs='italic'>
								No sponsor
							</Text>
						)}
					</Stack>
					{canEdit && (
						<EditSemesterSponsorModal
							semesterId={semester.id}
							stdNo={stdNo}
							currentSponsorId={semester.sponsorId}
						/>
					)}
				</Group>
			</Group>
		</Paper>
	);
}

type EditSemesterSponsorModalProps = {
	semesterId: number;
	stdNo: number;
	currentSponsorId: number | null;
};

function EditSemesterSponsorModal({
	semesterId,
	stdNo,
	currentSponsorId,
}: EditSemesterSponsorModalProps) {
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSponsorId, setSelectedSponsorId] = useState<string | null>(
		null
	);
	const queryClient = useQueryClient();

	const { data: studentSponsors, isLoading: isLoadingSponsors } = useQuery({
		queryKey: ['student-sponsors', stdNo],
		queryFn: () => getStudentSponsors(stdNo),
		enabled: opened,
	});

	useEffect(() => {
		if (opened && currentSponsorId) {
			setSelectedSponsorId(currentSponsorId.toString());
		}
	}, [opened, currentSponsorId]);

	const updateMutation = useMutation({
		mutationFn: async (sponsorId: number | null) =>
			updateStudentSemester(semesterId, { sponsorId }),
		onSuccess: () => {
			notifications.show({
				title: 'Success',
				message: 'Semester sponsor updated successfully',
				color: 'green',
			});
			queryClient.invalidateQueries({
				queryKey: ['student-registration-data'],
			});
			handleClose();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to update semester sponsor',
				color: 'red',
			});
		},
	});

	const sponsorOptions =
		studentSponsors?.map((ss) => ({
			value: ss.sponsor?.id.toString() || '',
			label: ss.sponsor?.name || 'Unknown',
		})) || [];

	const handleSubmit = () => {
		const sponsorId = selectedSponsorId ? Number(selectedSponsorId) : null;
		updateMutation.mutate(sponsorId);
	};

	const handleClose = () => {
		setSelectedSponsorId(currentSponsorId?.toString() || null);
		close();
	};

	return (
		<>
			<ActionIcon
				variant='subtle'
				color='gray'
				size='sm'
				onClick={open}
				title='Edit semester sponsor'
			>
				<IconEdit size='1rem' />
			</ActionIcon>
			<Modal
				opened={opened}
				onClose={handleClose}
				title='Edit Semester Sponsor'
				size='md'
				centered
			>
				<Stack gap='md'>
					<Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
						<Text size='sm'>
							Select a sponsor from the student&apos;s existing sponsorship
							records. To add a new sponsor, use the &quot;New Sponsor&quot;
							button at the top of this page.
						</Text>
					</Alert>

					{studentSponsors?.length === 0 ? (
						<Alert color='yellow'>
							<Text size='sm'>
								No sponsorship records found. Please create a sponsorship record
								using the &quot;New Sponsor&quot; button first.
							</Text>
						</Alert>
					) : (
						<Select
							label='Sponsor'
							placeholder='Select a sponsor'
							data={sponsorOptions}
							value={selectedSponsorId}
							onChange={setSelectedSponsorId}
							disabled={isLoadingSponsors}
							searchable
							clearable
							comboboxProps={{ withinPortal: true }}
						/>
					)}

					<Group justify='flex-end' gap='sm'>
						<Button
							variant='light'
							onClick={handleClose}
							disabled={updateMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							loading={updateMutation.isPending}
							disabled={studentSponsors?.length === 0}
						>
							Update
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}

function LoadingSkeleton() {
	return (
		<Stack gap='md'>
			{[1, 2, 3].map((i) => (
				<Paper key={i} withBorder p='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Group gap='xs'>
								<Skeleton height={16} width={80} />
							</Group>
							<Skeleton height={12} width={100} />
							<Skeleton height={12} width={120} />
						</Stack>
						<Stack gap={4} align='flex-end'>
							<Skeleton height={12} width={50} />
							<Skeleton height={22} width={100} />
						</Stack>
					</Group>
				</Paper>
			))}
		</Stack>
	);
}
