'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Divider,
	Group,
	Loader,
	Paper,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconEdit, IconRuler2, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteRubric, getRubric } from '../../server/actions';
import type { Rubric } from '../../types';
import RubricForm from './RubricForm';

type Props = {
	cmid: number;
	maxGrade: number;
};

export default function RubricView({ cmid, maxGrade }: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const queryClient = useQueryClient();

	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteRubric(cmid),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rubric', cmid] });
		},
	});

	if (isLoading) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<Loader size='md' />
					<Text c='dimmed' size='sm'>
						Loading rubric...
					</Text>
				</Stack>
			</Paper>
		);
	}

	if (isEditing || !rubric) {
		return (
			<RubricForm
				cmid={cmid}
				maxGrade={maxGrade}
				existingRubric={rubric ?? null}
				onCancel={() => setIsEditing(false)}
				onSuccess={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<Paper p='lg' withBorder>
			<Stack gap='md'>
				<Group justify='space-between' align='flex-start'>
					<Group gap='xs'>
						<ThemeIcon size='sm' variant='light' color='gray'>
							<IconRuler2 size={14} />
						</ThemeIcon>
						<Title order={5}>{rubric.name}</Title>
					</Group>
					<Group gap='xs'>
						<Badge variant='light' size='sm'>
							Max: {rubric.maxscore} points
						</Badge>
						<ActionIcon
							variant='subtle'
							color='gray'
							onClick={() => setIsEditing(true)}
						>
							<IconEdit size={16} />
						</ActionIcon>
						<ActionIcon
							variant='subtle'
							color='red'
							loading={deleteMutation.isPending}
							onClick={() => {
								if (confirm('Are you sure you want to delete this rubric?')) {
									deleteMutation.mutate();
								}
							}}
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Group>
				</Group>

				{rubric.description && (
					<Text size='sm' c='dimmed'>
						{rubric.description}
					</Text>
				)}

				<Divider />

				<RubricTable rubric={rubric} />
			</Stack>
		</Paper>
	);
}

function RubricTable({ rubric }: { rubric: Rubric }) {
	const maxLevels = Math.max(...rubric.criteria.map((c) => c.levels.length));

	return (
		<Box style={{ overflowX: 'auto' }}>
			<Table withTableBorder withColumnBorders>
				<Table.Thead>
					<Table.Tr>
						<Table.Th style={{ minWidth: 200 }}>Criterion</Table.Th>
						{Array.from({ length: maxLevels }).map((_, idx) => (
							<Table.Th key={`level-header-${idx}`} style={{ minWidth: 150 }}>
								Level {idx + 1}
							</Table.Th>
						))}
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{rubric.criteria
						.sort((a, b) => (a.sortorder ?? 0) - (b.sortorder ?? 0))
						.map((criterion) => (
							<Table.Tr key={criterion.id}>
								<Table.Td>
									<Text size='sm' fw={500}>
										{criterion.description}
									</Text>
								</Table.Td>
								{criterion.levels
									.sort((a, b) => a.score - b.score)
									.map((level) => (
										<Table.Td key={level.id}>
											<Stack gap={4}>
												<Badge size='xs' variant='light'>
													{level.score} pts
												</Badge>
												<Text size='xs'>{level.definition}</Text>
											</Stack>
										</Table.Td>
									))}
								{Array.from({
									length: maxLevels - criterion.levels.length,
								}).map((_, idx) => (
									<Table.Td key={`empty-${criterion.id}-${idx}`} />
								))}
							</Table.Tr>
						))}
				</Table.Tbody>
			</Table>
		</Box>
	);
}
