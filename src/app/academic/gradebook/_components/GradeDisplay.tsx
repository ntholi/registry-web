'use client';

import type { Grade } from '@academic/_database';
import { Badge, Text } from '@mantine/core';
import { getGradeColor } from '@/shared/lib/utils/colors';
import TotalMarkDisplay from './TotalMarkDisplay';

type ModuleGrade = {
	id: number;
	moduleId: number;
	stdNo: number;
	grade: Grade;
	weightedTotal: number;
	createdAt: Date | null;
	updatedAt: Date | null;
};

type Props = {
	studentModuleId: number;
	displayType: 'total' | 'grade';
	moduleId: number;
	moduleGrade?: ModuleGrade | null;
	isLoading?: boolean;
};

export default function GradeDisplay({
	studentModuleId,
	displayType,
	moduleId,
	moduleGrade,
	isLoading = false,
}: Props) {
	if (isLoading) {
		return (
			<Text c='dimmed' size='sm'>
				...
			</Text>
		);
	}
	if (!moduleGrade) {
		return (
			<Text c='dimmed' size='sm'>
				-
			</Text>
		);
	}
	const { weightedTotal, grade } = moduleGrade;
	const hasPassed = weightedTotal >= 50;

	if (displayType === 'total') {
		return (
			<TotalMarkDisplay
				weightedTotal={weightedTotal}
				hasPassed={hasPassed}
				studentModuleId={studentModuleId}
				moduleId={moduleId}
			/>
		);
	}

	const gradeColor = getGradeColor(grade);

	return (
		<Badge variant='light' color={gradeColor} radius={'sm'} w={50}>
			{grade}
		</Badge>
	);
}
