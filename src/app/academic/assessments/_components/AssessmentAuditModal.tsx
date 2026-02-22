'use client';

import type { assessments } from '@academic/_database';
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
import {
	IconEdit,
	IconHistory,
	IconInfoCircle,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { generateAssessmentAuditMessage } from '@/shared/lib/utils/auditUtils';
import { getAuditActionColor } from '@/shared/lib/utils/colors';
import {
	getAssessmentNumberLabel,
	getAssessmentTypeLabel,
} from '../_lib/utils';
import { getAssessmentAuditHistory } from '../_server/actions';

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
								const old = (audit.oldValues ?? {}) as Record<string, unknown>;
								const cur = (audit.newValues ?? {}) as Record<string, unknown>;
								const action = (audit.operation?.toLowerCase() ?? 'update') as
									| 'create'
									| 'update'
									| 'delete';
								const auditMessage = generateAssessmentAuditMessage(action, {
									previousAssessmentNumber:
										old.assessmentNumber != null
											? String(old.assessmentNumber)
											: undefined,
									newAssessmentNumber:
										cur.assessmentNumber != null
											? String(cur.assessmentNumber)
											: undefined,
									previousAssessmentType: old.assessmentType as
										| string
										| undefined,
									newAssessmentType: cur.assessmentType as string | undefined,
									previousTotalMarks: old.totalMarks as number | undefined,
									newTotalMarks: cur.totalMarks as number | undefined,
									previousWeight: old.weight as number | undefined,
									newWeight: cur.weight as number | undefined,
								});
								return (
									<Timeline.Item
										key={audit.id}
										bullet={
											<Avatar
												size='sm'
												radius='xl'
												color={getAuditActionColor(action)}
												variant='light'
											>
												{getActionIcon(action)}
											</Avatar>
										}
										title={
											<Paper p='md' radius='md' withBorder shadow='xs' mb='md'>
												<Stack gap={'xs'}>
													<Badge
														color={getAuditActionColor(action)}
														variant='light'
														size='md'
														radius='md'
														leftSection={getActionIcon(action)}
													>
														{action.toUpperCase()}
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
																src={audit.changedByUser?.image || undefined}
															/>
															<Box>
																<Text size='sm' fw={500}>
																	{audit.changedByUser?.name || 'Unknown User'}
																</Text>
																<Text size='xs' c='dimmed'>
																	{format(
																		new Date(audit.changedAt),
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
