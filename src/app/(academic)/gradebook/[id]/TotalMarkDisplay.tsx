'use client';

import {
	Alert,
	Badge,
	Box,
	Button,
	Group,
	Modal,
	Stack,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconAlertTriangle,
	IconChevronLeft,
	IconChevronRight,
	IconExclamationMark,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { moduleGrades } from '@/db/schema';
import { getLetterGrade } from '@/lib/utils/grades';
import { upsertModuleGrade } from '@/server/module-grades/actions';

type ModuleGrade = typeof moduleGrades.$inferSelect;

type Props = {
	weightedTotal: number;
	hasPassed: boolean;
	studentId: number;
	moduleId: number;
};

export default function TotalMarkDisplay({
	weightedTotal,
	hasPassed,
	studentId,
	moduleId,
}: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();
	const isBorderlineMark = (score: number): boolean => {
		const borderlineMarks = [44, 48, 49, 54, 59, 64, 69, 74, 79, 84, 89];
		return borderlineMarks.includes(Math.round(score));
	};

	const getBorderlineOptions = (
		score: number
	): { lower: number; higher: number } => {
		const floorScore = Math.round(score);

		if (floorScore === 48 || floorScore === 49) {
			return {
				lower: 47,
				higher: 50,
			};
		}

		return {
			lower: floorScore - 1,
			higher: floorScore + 1,
		};
	};
	const adjustGradeMutation = useMutation({
		mutationFn: async (newScore: number) => {
			const grade = getLetterGrade(newScore);
			return await upsertModuleGrade({
				moduleId,
				stdNo: studentId,
				grade,
				weightedTotal: newScore,
			});
		},
		onMutate: async (newScore) => {
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

			const newGrade = getLetterGrade(newScore);
			const optimisticModuleGrade = {
				id: Date.now(),
				moduleId,
				stdNo: studentId,
				grade: newGrade,
				weightedTotal: newScore,
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
			close();
		},
		onError: (_error, _newScore, context) => {
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
		},
	});

	const handleAdjustGrade = (newScore: number) => {
		adjustGradeMutation.mutate(newScore);
	};

	const isBorderline = isBorderlineMark(weightedTotal);
	const borderlineOptions = isBorderline
		? getBorderlineOptions(weightedTotal)
		: null;

	return (
		<>
			<Badge
				variant='light'
				pos='relative'
				color={hasPassed ? 'green' : 'red'}
				radius={'sm'}
				w={40}
				style={{
					cursor: isBorderline ? 'pointer' : 'default',
					border: isBorderline
						? `2px solid var(--mantine-color-orange-6)`
						: undefined,
					zIndex: 2,
				}}
				onClick={isBorderline ? open : undefined}
			>
				{isBorderline && (
					<Box pos='absolute' right={-2} top={1} style={{ zIndex: 10 }}>
						<IconExclamationMark size={14} />
					</Box>
				)}
				{Math.round(weightedTotal)}
			</Badge>

			<Modal
				opened={opened}
				onClose={close}
				title='Borderline Mark Adjustment'
				centered
			>
				<Stack gap='md'>
					<Alert
						icon={<IconAlertTriangle size={20} />}
						title='Borderline Mark'
						color='orange'
						variant='light'
					>
						The current mark of{' '}
						<Text c='orange.7' span fw='bold'>
							{Math.round(weightedTotal)}
						</Text>{' '}
						is considered borderline. You may adjust it to one of the adjacent
						values.
					</Alert>

					{borderlineOptions && (
						<Stack align='center' gap={0} mt='xs' pb='lg'>
							<Group justify='center' gap={'xl'} my='md'>
								<Button
									variant='outline'
									color='red.7'
									size='sm'
									leftSection={<IconChevronLeft size={16} />}
									onClick={() => handleAdjustGrade(borderlineOptions.lower)}
									disabled={adjustGradeMutation.isPending}
								>
									{borderlineOptions.lower}%
								</Button>
								<Button
									variant='outline'
									color='green.7'
									size='sm'
									rightSection={<IconChevronRight size={16} />}
									onClick={() => handleAdjustGrade(borderlineOptions.higher)}
									disabled={adjustGradeMutation.isPending}
								>
									{borderlineOptions.higher}%
								</Button>
							</Group>
						</Stack>
					)}
				</Stack>
			</Modal>
		</>
	);
}
