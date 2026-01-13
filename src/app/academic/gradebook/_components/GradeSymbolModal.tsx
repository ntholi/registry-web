'use client';

import type { grade } from '@academic/_database';
import { updateGradeByStudentModuleId } from '@academic/semester-modules';
import {
	ActionIcon,
	Badge,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	Radio,
	rem,
	SegmentedControl,
	Stack,
	Text,
	Tooltip,
	useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getLetterGrade } from '@/shared/lib/utils/grades';

interface Props {
	studentModuleId: number;
	stdNo: number;
	studentName: string;
	moduleId: number;
	currentGrade?: string;
	weightedTotal?: number;
	readOnly?: boolean;
}

type ManualGrade = 'DEF' | 'ANN' | 'EXP' | 'DNS';

export default function GradeSymbolModal({
	studentModuleId,
	stdNo,
	studentName,
	moduleId,
	currentGrade,
	weightedTotal = 0,
	readOnly = false,
}: Props) {
	const theme = useMantineTheme();
	const [opened, { open, close }] = useDisclosure(false);
	const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
	const [selectedGrade, setSelectedGrade] = useState<ManualGrade>('DEF');
	const queryClient = useQueryClient();

	const gradeUpdateMutation = useMutation({
		mutationFn: async (data: {
			grade: (typeof grade.enumValues)[number];
			weightedTotal: number;
		}) => {
			return await updateGradeByStudentModuleId(
				studentModuleId,
				data.grade,
				data.weightedTotal
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['module-grades', moduleId],
			});
			notifications.show({
				title: 'Success',
				message: 'Grade symbol updated successfully',
				color: 'green',
			});
			close();
		},
		onError: (error) => {
			notifications.show({
				title: 'Error',
				message: 'Failed to update grade symbol',
				color: 'red',
			});
			console.error('Error updating grade:', error);
		},
	});
	const handleSubmit = () => {
		if (mode === 'automatic') {
			const automaticGrade = getLetterGrade(weightedTotal);
			gradeUpdateMutation.mutate({
				grade: automaticGrade,
				weightedTotal,
			});
		} else {
			gradeUpdateMutation.mutate({
				grade: selectedGrade as (typeof grade.enumValues)[number],
				weightedTotal,
			});
		}
	};

	return (
		<>
			<Tooltip
				label={readOnly ? 'Gradebook is closed' : 'Change Grade Symbol'}
				position='top'
				withArrow
				transitionProps={{ transition: 'pop' }}
			>
				<ActionIcon
					variant='transparent'
					color='gray'
					onClick={readOnly ? undefined : open}
					radius='md'
					size='md'
					aria-label='Edit grade symbol'
					disabled={readOnly}
				>
					<IconEdit size={18} stroke={1.5} />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={opened}
				onClose={close}
				title='Change Grade Symbol'
				size='md'
				centered
				radius='md'
				overlayProps={{ blur: 3 }}
				shadow='md'
			>
				<Stack gap='lg'>
					<Paper withBorder p='md' radius='md'>
						<Stack gap='md'>
							<Group gap='md' align='center'>
								<Text size='sm' fw={500} w={100} c='dimmed'>
									Student:
								</Text>
								<Text size='sm' fw={600}>
									{studentName}{' '}
									<Text component='span' size='xs' c='dimmed'>
										({stdNo})
									</Text>
								</Text>
							</Group>

							<Group gap='md' align='center'>
								<Text size='sm' fw={500} w={100} c='dimmed'>
									Current Grade:
								</Text>
								{currentGrade ? (
									<Badge size='lg' variant='default'>
										{currentGrade}
									</Badge>
								) : (
									<Text size='sm' fs='italic' c='dimmed'>
										Not set
									</Text>
								)}
							</Group>
						</Stack>
					</Paper>

					<Divider label='Grade Assignment Method' labelPosition='center' />

					<SegmentedControl
						data={[
							{ label: 'Automatic', value: 'automatic' },
							{ label: 'Manual', value: 'manual' },
						]}
						value={mode}
						onChange={(value) => setMode(value as 'automatic' | 'manual')}
						fullWidth
						size='md'
						color={theme.primaryColor}
						styles={(theme) => ({
							indicator: {
								boxShadow: theme.shadows.xs,
							},
						})}
					/>

					{mode === 'automatic' ? (
						<Paper p='md' withBorder>
							<Stack gap='md'>
								<Text size='sm' c='dimmed'>
									The grade will be automatically generated based on the
									weighted total.
								</Text>
								<Group>
									<Text size='sm' fw={500}>
										Calculated Grade:
									</Text>
									<Badge size='lg' variant='light' color='green'>
										{getLetterGrade(weightedTotal)}
									</Badge>
								</Group>
							</Stack>
						</Paper>
					) : (
						<Paper p='md' radius='md' withBorder>
							<Stack gap='md'>
								<Text size='sm' fw={500}>
									Choose a manual grade symbol:
								</Text>
								<Radio.Group
									value={selectedGrade}
									onChange={(value) => setSelectedGrade(value as ManualGrade)}
									size='md'
								>
									<Group gap={rem(24)}>
										<Radio value='DEF' label='DEF' />
										<Radio value='ANN' label='ANN' />
										<Radio value='DNS' label='DNS' />
										<Radio value='EXP' label='EXP' />
									</Group>
								</Radio.Group>
							</Stack>
						</Paper>
					)}

					<Group justify='flex-end' mt={rem(16)}>
						<Button variant='light' onClick={close}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							loading={gradeUpdateMutation.isPending}
							color={theme.primaryColor}
						>
							Update Grade
						</Button>
					</Group>
				</Stack>
			</Modal>
		</>
	);
}
