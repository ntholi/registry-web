'use client';

import {
	Accordion,
	Alert,
	Badge,
	Button,
	Card,
	Divider,
	Flex,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { registrationRequests } from '@registry/_database';
import { getStudentRegistrationHistory } from '@registry/registration';
import { IconChevronRight, IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useActiveTerm } from '@/shared/lib/hooks/use-active-term';
import { formatDateTime, formatSemester } from '@/shared/lib/utils/utils';
import RegistrationModal from './form/RegistrationModal';

type StudentRegistrationHistory = {
	id: number;
	status: (typeof registrationRequests.$inferSelect)['status'];
	semesterNumber: string;
	createdAt: Date | null;
	term: {
		id: number;
		code: string;
	};
};

type Props = {
	stdNo: number;
	isActive?: boolean;
};

export default function RegistrationView({ stdNo, isActive = true }: Props) {
	const { activeTerm } = useActiveTerm();
	const [opened, { open, close }] = useDisclosure(false);
	const { data: session } = useSession();

	const {
		data: registrationRequests,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['registration-history', stdNo],
		queryFn: () => getStudentRegistrationHistory(stdNo),
		enabled: isActive,
	});

	if (isLoading) {
		return <RegistrationRequestsLoader />;
	}

	if (error) {
		return (
			<Alert color='red' title='Error'>
				Failed to load registration requests. Please try again.
			</Alert>
		);
	}

	const hasActiveTermRegistration = registrationRequests?.some(
		(request) => request.term.id === activeTerm?.id
	);

	if (!registrationRequests || registrationRequests.length === 0) {
		return (
			<>
				<Stack align='center' py='xl' gap='md'>
					<Text size='lg' fw={500} c='dimmed'>
						No registration requests found
					</Text>
					<Text size='sm' c='dimmed' ta='center'>
						This student has not submitted any registration requests yet.
					</Text>
					{['registry', 'admin'].includes(session?.user?.role ?? '') && (
						<Button
							leftSection={<IconPlus size={16} />}
							variant='filled'
							color='blue'
							onClick={open}
						>
							Create New Registration Request
						</Button>
					)}
				</Stack>

				<RegistrationModal opened={opened} onClose={close} stdNo={stdNo} />
			</>
		);
	}

	return (
		<>
			<Stack gap='md'>
				{!hasActiveTermRegistration &&
					activeTerm &&
					['registry', 'admin'].includes(session?.user?.role ?? '') && (
						<Card withBorder p='md'>
							<Group justify='space-between' align='center'>
								<Stack gap={4}>
									<Text size='sm' fw={500}>
										No registration for {activeTerm.code}
									</Text>
									<Text size='xs' c='dimmed'>
										Create a registration request for this student
									</Text>
								</Stack>
								<Button
									leftSection={<IconPlus size={14} />}
									variant='filled'
									size='sm'
									color='blue'
									onClick={open}
								>
									Create
								</Button>
							</Group>
						</Card>
					)}

				<Accordion
					variant='separated'
					defaultValue={registrationRequests[0]?.id.toString()}
				>
					{registrationRequests.map((request: StudentRegistrationHistory) => (
						<Accordion.Item key={request.id} value={request.id.toString()}>
							<Accordion.Control>
								<Stack gap={0} w={'100%'}>
									<Group justify='space-between' align='center'>
										<Group gap='xs' align='center'>
											<Text fw={500} size='sm'>
												{request.term.code}
											</Text>
											<Badge
												size='xs'
												radius={'xs'}
												variant='light'
												color={
													request.status === 'approved'
														? 'green'
														: request.status === 'rejected'
															? 'red'
															: request.status === 'registered'
																? 'blue'
																: 'yellow'
												}
											>
												{request.status.toUpperCase()}
											</Badge>
										</Group>
									</Group>
								</Stack>
							</Accordion.Control>
							<Accordion.Panel>
								<Divider mb='sm' />
								<Flex justify={'space-between'}>
									<Stack gap={8}>
										<Group>
											<Text size='sm' fw={500} w={150}>
												Semester
											</Text>
											<Text size='sm'>
												{formatSemester(request.semesterNumber)}
											</Text>
										</Group>
										<Group>
											<Text size='sm' fw={500} w={150}>
												Date Requested
											</Text>
											<Text size='sm'>{formatDateTime(request.createdAt)}</Text>
										</Group>
									</Stack>
									<Button
										component={Link}
										href={
											['finance', 'library'].includes(session?.user?.role ?? '')
												? `/registry/registration/requests/${request.status}/${request.id}?tab=clearance&dept=${session?.user?.role ?? ''}`
												: `/registry/registration/requests/${request.status}/${request.id}`
										}
										size='xs'
										variant='subtle'
										color='blue'
										rightSection={<IconChevronRight size={14} />}
									>
										View Details
									</Button>
								</Flex>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			</Stack>

			<RegistrationModal opened={opened} onClose={close} stdNo={stdNo} />
		</>
	);
}

function RegistrationRequestsLoader() {
	return (
		<Stack gap='md'>
			{[1, 2, 3].map((index) => (
				<Paper key={index} withBorder shadow='sm' p='md'>
					<Stack gap={0} w={'95%'}>
						<Group justify='space-between' align='center'>
							<Skeleton height={16} width={128} />
							<Skeleton height={20} width={64} />
						</Group>
						<Divider my='sm' />
					</Stack>
					<Stack gap={5} mt='sm'>
						<Group>
							<Skeleton height={12} width={80} />
							<Skeleton height={12} width={96} />
						</Group>
						<Group>
							<Skeleton height={12} width={80} />
							<Skeleton height={12} width={128} />
						</Group>
						<Group>
							<Skeleton height={12} width={80} />
							<Skeleton height={12} width={112} />
						</Group>
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
