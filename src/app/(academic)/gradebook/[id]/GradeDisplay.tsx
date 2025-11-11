'use client';

import { Badge, Text } from '@mantine/core';
import TotalMarkDisplay from './TotalMarkDisplay';

type ModuleGrade = {
	id: number;
	moduleId: number;
	stdNo: number;
	grade: string;
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

import { isFailingGrade } from '@/lib/utils/grades';

export default function GradeDisplay({
	studentId,
	displayType,
	moduleId,
	moduleGrade,
	isLoading = false,
}: Props) {
	const getGradeColor = (grade: string): string => {
		if (grade === 'ANN') return 'red';
		if (['A', 'B', 'C'].some((letter) => grade.startsWith(letter)))
			return 'green';
		if (['PP', 'DEF'].includes(grade)) return 'yellow';
		if (isFailingGrade(grade)) return 'red';
		return 'gray';
	};

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
