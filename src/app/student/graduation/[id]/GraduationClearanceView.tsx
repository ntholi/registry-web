'use client';
import {
	Alert,
	Badge,
	Box,
	Card,
	Divider,
	Group,
	Stack,
	Text,
	Timeline,
	TimelineItem,
	Title,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { formatDateTime, toTitleCase } from '@/lib/utils';
import type { getGraduationRequest } from '@/server/graduation/requests/actions';
import { getClearanceStatus, getStatusColor, getStatusIcon } from '../../utils/status';

interface Props {
	graduationRequest: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
}

export default function GraduationClearanceView({ graduationRequest }: Props) {
	const { graduationClearances = [] } = graduationRequest;
	const departments = ['academic', 'finance', 'library'];
	const _clearanceStatus = getClearanceStatus(graduationClearances);

	return (
		<Card withBorder p='md' radius='md'>
			<Stack gap='md'>
				<Box pos='relative'>
					<Group justify='space-between' align='center'>
						<Title order={2} size='h4' fw={600}>
							Clearance Status
						</Title>
					</Group>
				</Box>

				<Divider />

				{graduationClearances.length === 0 ? (
					<Alert icon={<IconInfoCircle size='1rem' />} color='gray' variant='light'>
						<Text size='sm'>
							Your graduation request doesn&apos;t have any clearance requirements assigned yet.
							Clearance requests will be created automatically once your graduation request is
							processed.
						</Text>
					</Alert>
				) : (
					<Timeline active={graduationClearances.length} bulletSize={20} lineWidth={2}>
						{departments.map((dept) => {
							const clearanceMapping = graduationClearances.find(
								(gc) => gc.clearance.department === dept
							);
							const clearance = clearanceMapping?.clearance;
							const status = clearance?.status || 'pending';

							return (
								<TimelineItem
									key={dept}
									title={
										<Group justify='space-between' align='center' wrap='wrap'>
											<Text fw={600} size='md'>
												{toTitleCase(dept)} Department
											</Text>
											<Badge
												color={getStatusColor(status)}
												variant='light'
												size='sm'
												leftSection={getStatusIcon(status)}
											>
												{toTitleCase(status)}
											</Badge>
										</Group>
									}
								>
									<Stack gap='xs' mt='xs'>
										<Box>
											<Text size='xs' c='dimmed' fw={500}>
												Created Date
											</Text>
											<Text size='sm'>
												{clearance ? formatDateTime(clearance.createdAt) : 'Not created yet'}
											</Text>
										</Box>

										{clearance?.responseDate && (
											<Box>
												<Text size='xs' c='dimmed' fw={500}>
													Response Date
												</Text>
												<Text size='sm'>{formatDateTime(clearance.responseDate)}</Text>
											</Box>
										)}

										{clearance?.message && (
											<ClearanceMessage message={clearance.message} status={clearance.status} />
										)}

										{clearance?.respondedBy && (
											<Box>
												<Text size='xs' c='dimmed' fw={500}>
													Processed By
												</Text>
												<Text size='sm'>{clearance.respondedBy.name}</Text>
											</Box>
										)}

										{clearance?.status === 'pending' && (
											<Text size='sm' c='dimmed' fs='italic'>
												Waiting for {toTitleCase(dept)} Department to process your graduation
												request...
											</Text>
										)}
									</Stack>
								</TimelineItem>
							);
						})}
					</Timeline>
				)}
			</Stack>
		</Card>
	);
}

function ClearanceMessage({
	message,
	status,
}: {
	message: string;
	status: 'pending' | 'approved' | 'rejected';
}) {
	const color = getStatusColor(status);

	const title =
		status === 'approved' ? 'Note' : status === 'rejected' ? 'Action Required' : 'Message';

	return (
		<Box>
			<Text size='xs' c='dimmed' fw={500} mb={4}>
				{title}
			</Text>
			<Alert color={color} variant='light' radius='sm'>
				<Text size='sm'>{message}</Text>
			</Alert>
		</Box>
	);
}
