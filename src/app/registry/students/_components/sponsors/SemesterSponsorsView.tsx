'use client';

import { getSponsor } from '@finance/sponsors';
import {
	Alert,
	Badge,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getStudentRegistrationData } from '../../_server/actions';
import { EditSemesterSponsorModal } from './sponsor-modals/EditSemesterSponsorModal';

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
