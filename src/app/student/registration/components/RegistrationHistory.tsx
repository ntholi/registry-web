'use client';

import {
	ActionIcon,
	Box,
	Card,
	CardSection,
	Flex,
	Group,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCalendar,
	IconChevronRight,
	IconFileText,
} from '@tabler/icons-react';
import Link from 'next/link';
import { formatDateTime, formatSemester } from '@/lib/utils';
import type { getStudentRegistrationHistory } from '@/server/registration/requests/actions';
import ProofOfRegistrationDownload from './ProofOfRegistrationDownload';
import StatusBadge from './StatusBadge';

type Props = {
	stdNo: number;
	data: Awaited<ReturnType<typeof getStudentRegistrationHistory>>;
};

export default function RegistrationHistory({ data, stdNo }: Props) {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }}>
			{data.map((request) => {
				return (
					<Card
						withBorder
						key={request.id}
						component={Link}
						href={`/student/registration/${request.id}`}
					>
						<CardSection p='xs'>
							<Flex gap='xs' align='center' justify='space-between'>
								<Group>
									<ThemeIcon variant='light' color='gray'>
										<IconCalendar size={'1rem'} />
									</ThemeIcon>
									<Text fw={600} size='lg'>
										{request.term.name}
									</Text>
								</Group>
								<StatusBadge status={request.status} requestId={request.id} />
							</Flex>
						</CardSection>

						<Flex justify={'space-between'} align={'center'}>
							<Box mt='xs'>
								<Text size='sm'>{formatSemester(request.semesterNumber)}</Text>
							</Box>
							{request.status === 'registered' && (
								<ProofOfRegistrationDownload
									stdNo={stdNo}
									termName={request.term.name}
									semesterNumber={request.semesterNumber}
								/>
							)}
						</Flex>

						<CardSection px='xs' mt='xs' py='xs' withBorder>
							<Flex gap='xs' align='center' justify='space-between'>
								<Text size='xs' c='dimmed'>
									Submitted: {formatDateTime(request.createdAt)}
								</Text>
								<Group>
									<Group gap='xs'>
										<Text size='xs' c='dimmed' fw={500}>
											View Details
										</Text>
										<ActionIcon variant='subtle' color='gray' size='sm'>
											<IconChevronRight size={16} />
										</ActionIcon>
									</Group>
								</Group>
							</Flex>
						</CardSection>
					</Card>
				);
			})}

			{data.length === 0 && (
				<Card shadow='sm' padding='xl' radius='md' withBorder>
					<Stack align='center' gap='md'>
						<IconFileText size={48} />
						<Stack align='center' gap='xs'>
							<Text fw={500} size='lg' c='dimmed'>
								No Registration Requests
							</Text>
							<Text size='sm' c='dimmed' ta='center'>
								You haven&apos;t submitted any registration requests yet. Your
								registration history will appear here once you submit your first
								request.
							</Text>
						</Stack>
					</Stack>
				</Card>
			)}
		</SimpleGrid>
	);
}
