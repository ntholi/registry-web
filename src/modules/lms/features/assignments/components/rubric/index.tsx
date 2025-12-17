'use client';

import {
	Badge,
	Box,
	Card,
	Group,
	Loader,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconRuler2 } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import type { Rubric, RubricCriterion, RubricLevel } from '../../types';
import RubricForm from './RubricForm';
import { getRubric } from './server/actions';

type Props = {
	cmid: number;
	maxGrade: number;
	assignmentName: string;
	isEditing: boolean;
	setIsEditing: (editing: boolean) => void;
	formRef: React.RefObject<{ submit: () => void } | null>;
};

export default function RubricView({
	cmid,
	maxGrade,
	assignmentName,
	isEditing,
	setIsEditing,
	formRef,
}: Props) {
	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	if (isLoading) {
		return (
			<Paper p='xl'>
				<Stack align='center' py='xl'>
					<Loader size='md' />
					<Text c='dimmed' size='sm'>
						Loading rubric...
					</Text>
				</Stack>
			</Paper>
		);
	}

	if (isEditing) {
		return (
			<RubricForm
				cmid={cmid}
				maxGrade={maxGrade}
				assignmentName={assignmentName}
				existingRubric={rubric ?? null}
				onSuccess={() => setIsEditing(false)}
				formRef={formRef}
			/>
		);
	}

	if (!rubric) {
		return (
			<Paper p='xl'>
				<Stack align='center' py='xl'>
					<ThemeIcon size='xl' variant='light' color='gray'>
						<IconRuler2 size={24} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No rubric has been created for this assignment yet.
					</Text>
				</Stack>
			</Paper>
		);
	}

	return <RubricDisplay rubric={rubric} />;
}

export function useRubricState(cmid: number) {
	const formRef = useRef<{ submit: () => void } | null>(null);
	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	return { rubric, isLoading, formRef };
}

function RubricDisplay({ rubric }: { rubric: Rubric }) {
	const sortedCriteria = [...rubric.criteria].sort(
		(a, b) => (a.sortorder ?? 0) - (b.sortorder ?? 0)
	);

	return (
		<Stack gap='md'>
			{sortedCriteria.map((criterion) => (
				<CriterionCard key={criterion.id} criterion={criterion} />
			))}
		</Stack>
	);
}

function CriterionCard({ criterion }: { criterion: RubricCriterion }) {
	const sortedLevels = [...criterion.levels].sort((a, b) => b.score - a.score);
	const maxScore = sortedLevels.length > 0 ? sortedLevels[0].score : 0;

	return (
		<Card padding={0} withBorder>
			<Box
				px='sm'
				py='xs'
				style={{
					borderBottom:
						'1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
				}}
			>
				<Group justify='space-between' align='center'>
					<Group gap='sm'>
						<Text fw={500} size='sm'>
							{criterion.description}
						</Text>
					</Group>
					<Badge variant='light' color='blue' size='sm'>
						{maxScore} pts
					</Badge>
				</Group>
			</Box>
			<SimpleGrid
				cols={{ base: 1, sm: 2, md: sortedLevels.length }}
				spacing={0}
			>
				{sortedLevels.map((level, levelIndex) => (
					<LevelCell
						key={level.id}
						level={level}
						isLast={levelIndex === sortedLevels.length - 1}
					/>
				))}
			</SimpleGrid>
		</Card>
	);
}

function LevelCell({ level, isLast }: { level: RubricLevel; isLast: boolean }) {
	return (
		<Box
			p='xs'
			style={{
				borderRight: !isLast
					? '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))'
					: undefined,
			}}
		>
			<Stack gap={4}>
				<Group gap='xs' align='center'>
					<Badge variant={'default'}>{level.score}</Badge>
				</Group>
				<Text size='xs' c='dimmed' lh={1.5}>
					{level.definition}
				</Text>
			</Stack>
		</Box>
	);
}
