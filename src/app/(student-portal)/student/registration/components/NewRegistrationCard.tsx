'use client';

import {
	Alert,
	Button,
	Card,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getBlockedStudentByStdNo } from '@/server/finance/blocked-students/actions';
import { getStudentRegistrationHistory } from '@/server/registry/registration/requests/actions';
import { useCurrentTerm } from '@/shared/lib/hooks/use-current-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';

export default function NewRegistrationCard() {
	const { student, isLoading: studentLoading } = useUserStudent();
	const { currentTerm } = useCurrentTerm();

	const hasExistingSemester =
		student?.programs
			.flatMap((program) => program.semesters)
			.some(
				(semester) =>
					semester.term === currentTerm?.name &&
					!['Deleted', 'Deferred', 'DroppedOut', 'Withdrawn'].includes(
						semester.status
					)
			) || false;

	const shouldFetchData = !!student?.stdNo && !hasExistingSemester;

	const { data: registrationHistory, isLoading: registrationLoading } =
		useQuery({
			queryKey: ['registration-history', student?.stdNo],
			queryFn: () => getStudentRegistrationHistory(student!.stdNo),
			enabled: shouldFetchData,
		});

	const { data: blockedStudent, isLoading: blockedLoading } = useQuery({
		queryKey: ['blocked-student', student?.stdNo],
		queryFn: () => getBlockedStudentByStdNo(student!.stdNo),
		enabled: shouldFetchData,
	});

	const isLoading = studentLoading || registrationLoading || blockedLoading;

	if (isLoading) {
		return (
			<Card withBorder>
				<Stack align='center' gap='md'>
					<Skeleton height={60} width={60} radius='md' />
					<Stack align='center' gap='xs' w='100%'>
						<Skeleton height={24} width={200} />
						<Skeleton height={16} width={300} />
						<Skeleton height={16} width={250} />
					</Stack>
					<Skeleton height={36} width={150} radius='md' />
				</Stack>
			</Card>
		);
	}

	if (hasExistingSemester) {
		return null;
	}

	const hasCurrentRegistration =
		registrationHistory?.some(
			(request) => request.term.id === currentTerm?.id
		) || false;

	const isBlocked = blockedStudent && blockedStudent.status === 'blocked';

	if (hasCurrentRegistration) {
		return null;
	}

	if (isBlocked) {
		return (
			<Alert
				icon={<IconInfoCircle size='1rem' />}
				title='Registration Blocked'
				color='red'
				mb='xl'
			>
				Your account has been blocked from registering. Please contact the{' '}
				{blockedStudent.byDepartment} office for assistance.
				<br />
				<Text fw={500} mt='xs'>
					Reason: {blockedStudent?.reason}
				</Text>
			</Alert>
		);
	}

	return (
		<Card withBorder>
			<Stack align='center' gap='md'>
				<ThemeIcon variant='light' color='gray' size='xl'>
					<IconPlus size={'1.5rem'} />
				</ThemeIcon>
				<Stack align='center' gap='xs'>
					<Text fw={500} size='lg'>
						Start New Registration
					</Text>
					<Text size='sm' c='dimmed' ta='center'>
						You don&apos;t have a registration request for
						<Text span fw={600}>
							{currentTerm?.name}
						</Text>
						yet. Click below to start your registration process.
					</Text>
				</Stack>
				<Button component={Link} href='/student/registration/new'>
					New Registration
				</Button>
			</Stack>
		</Card>
	);
}
