'use client';

import {
	Badge,
	Box,
	Loader,
	Paper,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import { IconRuler2 } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { getRubric } from '../../server/actions';
import type { Rubric } from '../../types';
import RubricForm from './RubricForm';

type Props = {
	cmid: number;
	maxGrade: number;
	assessmentName: string;
	isEditing: boolean;
	setIsEditing: (editing: boolean) => void;
	formRef: React.RefObject<{ submit: () => void } | null>;
};

export default function RubricView({
	cmid,
	maxGrade,
	assessmentName,
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

	if (isEditing) {
		return (
			<RubricForm
				cmid={cmid}
				maxGrade={maxGrade}
				assessmentName={assessmentName}
				existingRubric={rubric ?? null}
				onSuccess={() => setIsEditing(false)}
				formRef={formRef}
			/>
		);
	}

	if (!rubric) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' py='xl'>
					<ThemeIcon size='xl' variant='light' color='gray'>
						<IconRuler2 size={24} />
					</ThemeIcon>
					<Text c='dimmed' size='sm'>
						No rubric has been created for this assessment yet.
					</Text>
				</Stack>
			</Paper>
		);
	}

	return <RubricTable rubric={rubric} />;
}

export function useRubricState(cmid: number) {
	const formRef = useRef<{ submit: () => void } | null>(null);
	const { data: rubric, isLoading } = useQuery({
		queryKey: ['rubric', cmid],
		queryFn: () => getRubric(cmid),
	});

	return { rubric, isLoading, formRef };
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
							<Table.Th key={`level-${idx + 1}`} style={{ minWidth: 150 }}>
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
