import {
	ActionIcon,
	Badge,
	Card,
	CardSection,
	Flex,
	Group,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	getGraduationStatus,
	getStatusColor,
} from '@student-portal/student/utils/status';
import {
	IconChevronRight,
	IconFileText,
	IconSchool,
} from '@tabler/icons-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils/utils';
import { getGraduationRequestByStudentNo } from '@/server/registry/graduation/requests/actions';

interface GraduationHistoryProps {
	stdNo: number;
}

export default async function GraduationHistory({
	stdNo,
}: GraduationHistoryProps) {
	const graduationRequest = await getGraduationRequestByStudentNo(stdNo);

	if (!graduationRequest) {
		return (
			<Card shadow='sm' padding='xl' radius='md' withBorder>
				<Stack align='center' gap='md'>
					<IconFileText size={48} />
					<Stack align='center' gap='xs'>
						<Text fw={500} size='lg' c='dimmed'>
							No Graduation Request
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							You haven&apos;t submitted a graduation request yet. Your
							graduation request will appear here once you submit it.
						</Text>
					</Stack>
				</Stack>
			</Card>
		);
	}

	const status = getGraduationStatus(graduationRequest);

	return (
		<Card
			withBorder
			component={Link}
			href={`/student/graduation/${graduationRequest.id}`}
		>
			<CardSection p='xs'>
				<Flex gap='xs' align='center' justify='space-between'>
					<Group>
						<ThemeIcon variant='light' color='violet'>
							<IconSchool size={'1rem'} />
						</ThemeIcon>
						<Text fw={600} size='lg'>
							Graduation Request
						</Text>
					</Group>
					<Badge color={getStatusColor(status)} variant='light' size='sm'>
						{status}
					</Badge>
				</Flex>
			</CardSection>

			<CardSection px='xs' mt='xs' py='xs' withBorder>
				<Flex gap='xs' align='center' justify='space-between'>
					<Text size='xs' c='dimmed'>
						Submitted: {formatDateTime(graduationRequest.createdAt!)}
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
}
