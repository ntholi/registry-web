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
import { getStudentRegistrationHistory } from '@registry/registration';
import { canStudentRegister } from '@registry/terms/settings/_server/termRegistrationsActions';
import { IconInfoCircle, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getBlockedStudentByStdNo } from '@/app/registry/blocked-students';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import useUserStudent from '@/shared/lib/hooks/use-user-student';
import { isActiveSemester } from '@/shared/lib/utils/utils';

export default function NewRegistrationCard() {
	const { student, program, isLoading: studentLoading } = useUserStudent();
	const { activeTerm } = useActiveTerm();

	const existingSemester = student?.programs
		.filter((p) => p.status === 'Active')
		.flatMap((p) => p.semesters)
		.find(
			(semester) =>
				semester.termCode === activeTerm?.code &&
				isActiveSemester(semester.status)
		);

	const hasExistingSemester = !!existingSemester;

	const shouldFetchData = !!student?.stdNo && !!activeTerm?.id && !!program;

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

	const { data: regAccess, isLoading: regAccessLoading } = useQuery({
		queryKey: [
			'can-register',
			activeTerm?.id,
			program?.schoolId,
			program?.structure?.program?.id,
		],
		queryFn: () =>
			canStudentRegister(
				activeTerm!.id,
				program!.schoolId,
				program!.structure.program.id
			),
		enabled: shouldFetchData,
	});

	const isLoading =
		studentLoading || registrationLoading || blockedLoading || regAccessLoading;

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

	if (!regAccess?.allowed) {
		return null;
	}

	const hasPendingRegistration = registrationHistory?.some(
		(request) =>
			request.term.id === activeTerm?.id && request.status === 'pending'
	);

	const isBlocked = blockedStudent && blockedStudent.status === 'blocked';

	if (hasPendingRegistration) {
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

	if (hasExistingSemester) {
		return (
			<Card withBorder>
				<Stack align='center' gap='md'>
					<ThemeIcon variant='light' color='teal' size='xl'>
						<IconPlus size='1.5rem' />
					</ThemeIcon>
					<Stack align='center' gap='xs'>
						<Text fw={500} size='lg'>
							Add More Modules
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							You are already registered for
							<Text span fw={600}>
								{` ${activeTerm?.code} `}
							</Text>
							but you can add additional modules to your registration.
						</Text>
					</Stack>
					<Button
						component={Link}
						href='/student-portal/registration/new'
						variant='light'
						color='teal'
					>
						Add Modules
					</Button>
				</Stack>
			</Card>
		);
	}

	return (
		<Card withBorder>
			<Stack align='center' gap='md'>
				<ThemeIcon variant='light' color='gray' size='xl'>
					<IconPlus size='1.5rem' />
				</ThemeIcon>
				<Stack align='center' gap='xs'>
					<Text fw={500} size='lg'>
						Start New Registration
					</Text>
					<Text size='sm' c='dimmed' ta='center'>
						You don&apos;t have a registration request for
						<Text span fw={600}>
							{` ${activeTerm?.code} `}
						</Text>
						yet. Click below to start your registration process.
					</Text>
				</Stack>
				<Button component={Link} href='/student-portal/registration/new'>
					New Registration
				</Button>
			</Stack>
		</Card>
	);
}
