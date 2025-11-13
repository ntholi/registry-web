'use client';

import {
	ActionIcon,
	Avatar,
	Box,
	Center,
	Group,
	Loader,
	Modal,
	Paper,
	Stack,
	Text,
	Timeline,
	Tooltip,
	useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconEdit,
	IconHistory,
	IconInfoCircle,
	IconPlus,
	IconTrash,
	IconUser,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getMarksAudit } from '@/modules/academic/features/assessment-marks/server/actions';
import { getAssessmentTypeLabel } from '@/modules/academic/features/assessments/components/[id]/assessments';
import { generateAssessmentMarkAuditMessage } from '@/shared/lib/utils/auditUtils';

interface Props {
	stdNo: number;
	studentName: string;
}

export default function MarksAuditModal({ stdNo, studentName }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const { colorScheme } = useMantineColorScheme();

	const { data: auditHistory, isLoading } = useQuery({
		queryKey: ['marksAudit', stdNo],
		queryFn: () => getMarksAudit(stdNo),
		enabled: opened,
	});

	return (
		<>
			<Tooltip label='View Marks History'>
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
							<IconUser size={20} />
						</Avatar>
						<Box>
							<Text fw={600} size='lg' mb={2}>
								Assessment Marks History
							</Text>
							<Text size='sm' c='dimmed'>
								{studentName} ({stdNo})
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
						<Stack align='center' gap='lg'>
							<Loader size='xl' variant='dots' color='blue' />
							<Text size='md' c='dimmed' fw={500}>
								Loading assessment marks history...
							</Text>
						</Stack>
					</Center>
				) : !auditHistory || auditHistory.length === 0 ? (
					<Paper
						p='xl'
						radius='lg'
						withBorder
						bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'}
					>
						<Center py='xl'>
							<Stack align='center' gap='lg'>
								<Avatar size={80} radius='xl' variant='light' color='blue'>
									<IconHistory size={40} />
								</Avatar>
								<Stack align='center' gap='xs'>
									<Text fw={600} size='xl'>
										No Assessment History
									</Text>
									<Text c='dimmed' size='md' ta='center' maw={400} lh={1.5}>
										No assessment mark changes have been recorded for this
										student yet.
										<br />
										All future modifications will appear here as a chronological
										timeline.
									</Text>
								</Stack>
							</Stack>
						</Center>
					</Paper>
				) : (
					<Box
						style={{
							maxHeight: '500px',
							overflowY: 'auto',
							paddingRight: '8px',
						}}
					>
						<Timeline
							active={auditHistory.length}
							lineWidth={1}
							bulletSize={30}
						>
							{auditHistory.map((audit, index) => {
								const assessmentType = getAssessmentTypeLabel(
									audit.assessmentMark?.assessment?.assessmentType
								);
								const auditMessage = generateAssessmentMarkAuditMessage(
									audit.action,
									audit.previousMarks,
									audit.newMarks,
									assessmentType
								);

								const getActionIcon = (
									action: 'create' | 'update' | 'delete'
								) => {
									switch (action) {
										case 'create':
											return <IconPlus size={16} />;
										case 'update':
											return <IconEdit size={16} />;
										case 'delete':
											return <IconTrash size={16} />;
										default:
											return <IconInfoCircle size={16} />;
									}
								};

								return (
									<Timeline.Item
										key={audit.id}
										bullet={getActionIcon(audit.action)}
										title={
											<Box mb='xs'>
												<Text size='sm' fw={600} lh={1.4}>
													{auditMessage}
												</Text>
											</Box>
										}
										lineVariant={
											index === auditHistory.length - 1 ? 'dashed' : 'solid'
										}
									>
										<Paper
											p='sm'
											radius='md'
											withBorder
											bg={colorScheme === 'dark' ? 'dark.6' : 'gray.0'}
											mt='xs'
										>
											<Group gap='sm' align='center'>
												<Avatar radius='xl' src={audit.createdByUser?.image} />
												<Box flex={1}>
													<Text size='sm' fw={500}>
														{audit.createdByUser?.name || 'Unknown User'}
													</Text>
													<Text size='xs' c='dimmed'>
														{format(
															new Date(audit.date),
															"EEEE, dd MMM yyyy 'at' HH:mm"
														)}
													</Text>
												</Box>
											</Group>
										</Paper>
									</Timeline.Item>
								);
							})}
						</Timeline>
					</Box>
				)}
			</Modal>
		</>
	);
}
