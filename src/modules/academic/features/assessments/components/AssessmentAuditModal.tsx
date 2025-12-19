'use client';

import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Card,
	Center,
	Group,
	Loader,
	Modal,
	Paper,
	Stack,
	Text,
	Timeline,
	Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { getAuditActionColor } from '@student-portal/utils';
import {
	IconEdit,
	IconHistory,
	IconInfoCircle,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { assessments } from '@/modules/academic/database';
import { generateAssessmentAuditMessage } from '@/shared/lib/utils/auditUtils';
import { getAssessmentAuditHistory } from '../server/actions';
import { getAssessmentNumberLabel, getAssessmentTypeLabel } from '../utils';

interface Props {
	assessment: NonNullable<typeof assessments.$inferSelect>;
}

export default function AssessmentAuditModal({ assessment }: Props) {
	const [opened, { open, close }] = useDisclosure(false);

	const { data: auditHistory, isLoading } = useQuery({
		queryKey: ['assessment-audit-history', assessment.id],
		queryFn: () => getAssessmentAuditHistory(assessment.id),
		enabled: opened,
	});

	const getActionIcon = (action: 'create' | 'update' | 'delete') => {
		switch (action) {
			case 'create':
				return <IconPlus size={16} />;
			case 'update':
				return <IconEdit size={16} />;
			case 'delete':
				return <IconTrash size={16} />;
			default:
				return <IconEdit size={16} />;
		}
	};
	return (
		<>
			<Tooltip label='View Audit History'>
				<ActionIcon variant='subtle' color='gray' onClick={open}>
					<IconHistory size={16} />
				</ActionIcon>
			</Tooltip>
			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap='md' align='center'>
						<Avatar size='md' radius='md' variant='light' color='blue'>
							<IconHistory size={20} />
						</Avatar>
						<Box>
							<Text fw={600} size='lg' mb={2}>
								Audit History
							</Text>
							<Text size='sm' c='dimmed'>
								{getAssessmentNumberLabel(assessment.assessmentNumber)} -{' '}
								{getAssessmentTypeLabel(assessment.assessmentType)}
							</Text>
						</Box>
					</Group>
				}
				size='xl'
				centered
				overlayProps={{
					backgroundOpacity: 0.55,
					blur: 3,
				}}
				radius='lg'
				padding='xl'
			>
				{isLoading ? (
					<Center py='xl'>
						<Stack align='center' gap='md'>
							<Loader size='lg' variant='dots' color='blue' />
							<Text size='sm' c='dimmed'>
								Loading audit history...
							</Text>
						</Stack>
					</Center>
				) : !auditHistory || auditHistory.length === 0 ? (
					<Paper p='xl' radius='lg' withBorder>
						<Center>
							<Stack align='center' gap='lg'>
								<Avatar size='xl' radius='xl' variant='light' color='gray'>
									<IconInfoCircle size={32} />
								</Avatar>
								<Stack align='center' gap='xs'>
									<Text fw={500} size='lg'>
										No Audit History
									</Text>
									<Text c='dimmed' size='sm' ta='center'>
										No changes have been recorded for this assessment yet.
										<br />
										All future modifications will appear here.
									</Text>
								</Stack>
							</Stack>
						</Center>
					</Paper>
				) : (
					<Timeline
						active={auditHistory.length}
						bulletSize={32}
						lineWidth={3}
						color='blue'
					>
						{auditHistory.map(
							(audit: NonNullable<typeof auditHistory>[number]) => {
								const auditMessage = generateAssessmentAuditMessage(
									audit.action,
									{
										previousAssessmentNumber: audit.previousAssessmentNumber,
										newAssessmentNumber: audit.newAssessmentNumber,
										previousAssessmentType: audit.previousAssessmentType,
										newAssessmentType: audit.newAssessmentType,
										previousTotalMarks: audit.previousTotalMarks,
										newTotalMarks: audit.newTotalMarks,
										previousWeight: audit.previousWeight,
										newWeight: audit.newWeight,
									}
								);
								return (
									<Timeline.Item
										key={audit.id}
										bullet={
											<Avatar
												size='sm'
												radius='xl'
												color={getAuditActionColor(audit.action)}
												variant='light'
											>
												{getActionIcon(audit.action)}
											</Avatar>
										}
										title={
											<Paper p='md' radius='md' withBorder shadow='xs' mb='md'>
												<Stack gap={'xs'}>
													<Badge
														color={getAuditActionColor(audit.action)}
														variant='light'
														size='md'
														radius='md'
														leftSection={getActionIcon(audit.action)}
													>
														{audit.action.toUpperCase()}
													</Badge>
													<Text size='sm' lh={1.5}>
														{auditMessage}
													</Text>
													<Card p='sm' radius='md'>
														<Group gap='sm' align='center'>
															<Avatar
																size='sm'
																radius='xl'
																color='blue'
																variant='light'
																src={audit.createdByUser?.image || undefined}
															/>
															<Box>
																<Text size='sm' fw={500}>
																	{audit.createdByUser?.name || 'Unknown User'}
																</Text>
																<Text size='xs' c='dimmed'>
																	{format(
																		new Date(audit.date),
																		"dd MMM yyyy 'at' HH:mm"
																	)}
																</Text>
															</Box>
														</Group>
													</Card>
												</Stack>
											</Paper>
										}
									></Timeline.Item>
								);
							}
						)}
					</Timeline>
				)}
			</Modal>
		</>
	);
}
