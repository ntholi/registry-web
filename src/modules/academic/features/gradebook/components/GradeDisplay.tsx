'use client';

import { Badge, Text } from '@mantine/core';
import { getGradeColor } from '@student-portal/utils';
import type { Grade } from '@/modules/academic/database';
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
	studentId: number;
	displayType: 'total' | 'grade';
	moduleId: number;
	moduleGrade?: ModuleGrade | null;
	isLoading?: boolean;
};

export default function GradeDisplay({
	studentId,
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
				studentId={studentId}
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
