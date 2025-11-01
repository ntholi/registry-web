'use client';

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
import type { grade, moduleGrades } from '@/db/schema';
import { upsertModuleGrade } from '@/server/module-grades/actions';
import { getLetterGrade } from '@/utils/grades';

interface Props {
	studentId: number;
	studentName: string;
	moduleId: number;
	currentGrade?: string;
	weightedTotal?: number;
}

type Grade = 'DEF' | 'ANN' | 'EXP' | 'DNS';
type ModuleGrade = typeof moduleGrades.$inferSelect;

export default function GradeSymbolModal({
	studentId,
	studentName,
	moduleId,
	currentGrade,
	weightedTotal = 0,
}: Props) {
	const theme = useMantineTheme();
	const [opened, { open, close }] = useDisclosure(false);
	const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
	const [selectedGrade, setSelectedGrade] = useState<Grade>('DEF');
	const queryClient = useQueryClient();
	const gradeUpdateMutation = useMutation({
		mutationFn: async (data: {
			grade: (typeof grade.enumValues)[number];
			weightedTotal: number;
		}) => {
			return await upsertModuleGrade({
				moduleId,
				stdNo: studentId,
				grade: data.grade,
				weightedTotal: data.weightedTotal,
			});
		},
		onMutate: async (data) => {
			await queryClient.cancelQueries({
				queryKey: ['moduleGrade', moduleId, studentId],
			});
			await queryClient.cancelQueries({
				queryKey: ['moduleGrades', moduleId],
			});

			const previousModuleGrade = queryClient.getQueryData([
				'moduleGrade',
				moduleId,
				studentId,
			]);
			const previousModuleGrades = queryClient.getQueryData([
				'moduleGrades',
				moduleId,
			]);

			const optimisticModuleGrade = {
				id: Date.now(),
				moduleId,
				stdNo: studentId,
				grade: data.grade,
				weightedTotal: data.weightedTotal,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			queryClient.setQueryData(
				['moduleGrade', moduleId, studentId],
				optimisticModuleGrade
			);

			queryClient.setQueryData(
				['moduleGrades', moduleId],
				(old: ModuleGrade[]) => {
					if (!old) return [optimisticModuleGrade];

					const existingIndex = old.findIndex(
						(grade) => grade.stdNo === studentId
					);

					if (existingIndex >= 0) {
						const updated = [...old];
						updated[existingIndex] = optimisticModuleGrade;
						return updated;
					} else {
						return [...old, optimisticModuleGrade];
					}
				}
			);

			return { previousModuleGrade, previousModuleGrades };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['moduleGrade', moduleId, studentId],
			});
			queryClient.invalidateQueries({
				queryKey: ['moduleGrades', moduleId],
			});
			notifications.show({
				title: 'Success',
				message: 'Grade symbol updated successfully',
				color: 'green',
			});
			close();
		},
		onError: (error, _data, context) => {
			if (context?.previousModuleGrade) {
				queryClient.setQueryData(
					['moduleGrade', moduleId, studentId],
					context.previousModuleGrade
				);
			}
			if (context?.previousModuleGrades) {
				queryClient.setQueryData(
					['moduleGrades', moduleId],
					context.previousModuleGrades
				);
			}

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
				label='Change Grade Symbol'
				position='top'
				withArrow
				transitionProps={{ transition: 'pop' }}
			>
				<ActionIcon
					variant='transparent'
					color='gray'
					onClick={open}
					radius='md'
					size='md'
					aria-label='Edit grade symbol'
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
										({studentId})
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
									onChange={(value) => setSelectedGrade(value as Grade)}
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
