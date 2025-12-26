'use client';

import {
	Alert,
	Badge,
	Box,
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { getStatusColor } from '@/shared/lib/utils/colors';
import { formatSemester } from '@/shared/lib/utils/utils';
import { getStudentRegistrationData } from '../../_server/actions';
import ProofOfRegistrationTermPrinter from './proof/ProofOfRegistrationTermPrinter';

type Props = {
	stdNo: number;
	isActive?: boolean;
};

type StudentData = Awaited<ReturnType<typeof getStudentRegistrationData>>;
type Program = NonNullable<StudentData>['programs'][number];
type Semester = Program['semesters'][number];

export default function SemestersView({ stdNo, isActive = true }: Props) {
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
				Failed to load registered semesters. Please try again.
			</Alert>
		);
	}

	const activeProgram = data?.programs?.find((p) => p.status === 'Active');
	const semesters = activeProgram?.semesters || [];

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
				<SemesterCard key={semester.id} semester={semester} stdNo={stdNo} />
			))}
		</Stack>
	);
}

type SemesterCardProps = {
	semester: Semester;
	stdNo: number;
};

function SemesterCard({ semester, stdNo }: SemesterCardProps) {
	const semesterNumber = semester.structureSemester?.semesterNumber || '1';
	const moduleCount = semester.studentModules?.length || 0;
	const totalCredits =
		semester.studentModules?.reduce((sum, m) => sum + (m.credits || 0), 0) || 0;

	return (
		<Card withBorder p='md'>
			<Group justify='space-between' align='flex-start'>
				<Stack gap={4}>
					<Group gap='xs'>
						<Text fw={500} size='sm'>
							{semester.termCode}
						</Text>
						<Badge
							size='xs'
							radius='xs'
							color={getStatusColor(semester.status)}
						>
							{semester.status}
						</Badge>
					</Group>
					<Text size='xs' c='dimmed'>
						{formatSemester(semesterNumber)}
					</Text>
					<Text size='xs' c='dimmed'>
						{moduleCount} module{moduleCount !== 1 ? 's' : ''} • {totalCredits}{' '}
						credits
					</Text>
				</Stack>
				<Box>
					<ProofOfRegistrationTermPrinter
						stdNo={stdNo}
						termCode={semester.termCode}
					/>
				</Box>
			</Group>
		</Card>
	);
}

function LoadingSkeleton() {
	return (
		<Stack gap='md'>
			{[1, 2, 3].map((i) => (
				<Card key={i} withBorder p='md'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Group gap='xs'>
								<Skeleton height={16} width={80} />
								<Skeleton height={18} width={60} />
							</Group>
							<Skeleton height={12} width={100} />
							<Skeleton height={12} width={120} />
						</Stack>
						<Skeleton height={28} width={60} />
					</Group>
				</Card>
			))}
		</Stack>
	);
}
