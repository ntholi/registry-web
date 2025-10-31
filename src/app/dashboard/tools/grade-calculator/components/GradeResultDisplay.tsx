'use client';

import { Badge, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { getGradeColor, getPointsColor } from './gradeColors';

type GradeResult = {
	grade: string;
	points: number | null;
	description: string;
	marksRange?: { min: number; max: number };
};

interface GradeResultDisplayProps {
	result: GradeResult;
}

export function GradeResultDisplay({ result }: GradeResultDisplayProps) {
	const gradeColor = getGradeColor(result.grade);

	return (
		<Paper withBorder shadow="md" p="lg">
			<Stack gap="lg">
				<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
					<Stack gap={2}>
						<Text fw={600} size="sm" c="dimmed">
							Grade
						</Text>
						<Badge size="lg" color={gradeColor} variant="gradient">
							{result.grade}
						</Badge>
					</Stack>
					<Stack gap={2}>
						<Text fw={600} size="sm" c="dimmed">
							Grade Points
						</Text>
						<Group gap={0} align="baseline">
							<Text size="lg" c={getPointsColor(result.points)}>
								{result.points !== null ? result.points.toFixed(2) : 'N/A'}
							</Text>
							<Text size="xs" c="dimmed">
								/4.00
							</Text>
						</Group>
					</Stack>

					{result.marksRange && (
						<Stack gap={1}>
							<Text fw={600} size="sm" c="dimmed">
								Marks Range
							</Text>
							<Text>
								{result.marksRange.min} - {result.marksRange.max}
							</Text>
						</Stack>
					)}
				</SimpleGrid>

				<Stack gap={1}>
					<Text fw={600} size="sm" c="dimmed">
						Description
					</Text>
					<Text>{result.description}</Text>
				</Stack>
			</Stack>
		</Paper>
	);
}
