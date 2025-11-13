'use client';

import {
	Button,
	Group,
	Paper,
	Select,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconCheck, IconQuestionMark } from '@tabler/icons-react';
import { useState } from 'react';
import { getAssessmentTypeLabel } from '@/modules/academic/features/assessments/components/[id]/assessments';
import type {
	AssessmentInfo,
	ColumnMapping,
	DetectedColumns,
	ExcelData,
} from './types';
import { columnIndexToLetter } from './utils';

type Props = {
	excelData: ExcelData;
	detectedColumns: DetectedColumns;
	assessments: AssessmentInfo[];
	onConfirm: (mapping: ColumnMapping) => void;
	onBack: () => void;
};

export default function AssessmentMapping({
	excelData,
	detectedColumns,
	assessments,
	onConfirm,
	onBack,
}: Props) {
	const [mapping, setMapping] = useState<ColumnMapping>({
		studentNumberColumn: detectedColumns.studentNumberColumn,
		assessmentColumns: detectedColumns.assessmentColumns,
	});
	const columnOptions = excelData.headers.map((_header, index) => ({
		value: columnIndexToLetter(index),
		label: `Column ${columnIndexToLetter(index)}`,
	}));
	const handleStudentNumberColumnChange = (value: string | null) => {
		setMapping({
			...mapping,
			studentNumberColumn: value,
		});
	};

	const handleAssessmentColumnChange = (
		assessmentId: number,
		value: string | null
	) => {
		const newAssessmentColumns = { ...mapping.assessmentColumns };
		if (value) {
			newAssessmentColumns[assessmentId] = value;
		} else {
			delete newAssessmentColumns[assessmentId];
		}

		setMapping({
			...mapping,
			assessmentColumns: newAssessmentColumns,
		});
	};
	const isComplete = mapping.studentNumberColumn;

	const handleConfirm = () => {
		if (isComplete) {
			onConfirm(mapping);
		}
	};

	return (
		<Stack gap='md'>
			<Group align='center' gap='sm'>
				<Title order={4}>Column Mapping</Title>
			</Group>
			<Stack gap='sm'>
				<Text size='sm' fw={500}>
					Student Number Column
				</Text>
				<Select
					placeholder='Select student number column'
					data={columnOptions}
					value={mapping.studentNumberColumn}
					onChange={handleStudentNumberColumnChange}
					searchable
					clearable
				/>
			</Stack>
			<Paper withBorder p='md'>
				<Stack gap='sm'>
					<Text size='sm' fw={500}>
						Assessment Columns
					</Text>{' '}
					<Text size='xs' c='dimmed'>
						Map each assessment to its corresponding column. You can choose to
						import only specific assessments by leaving others unmapped.
					</Text>
					{assessments.map((assessment) => (
						<Group key={assessment.id} align='center' gap='md'>
							<Text size='sm' style={{ minWidth: 200 }}>
								{getAssessmentTypeLabel(assessment.assessmentType)}
							</Text>
							<Select
								placeholder='Select column'
								data={columnOptions}
								value={mapping.assessmentColumns[assessment.id] || null}
								onChange={(value) =>
									handleAssessmentColumnChange(assessment.id, value)
								}
								searchable
								clearable
								style={{ flex: 1 }}
							/>
							{mapping.assessmentColumns[assessment.id] ? (
								<IconCheck size='1rem' color='green' />
							) : (
								<IconQuestionMark size='1rem' color='gray' />
							)}
						</Group>
					))}
				</Stack>
			</Paper>
			<Group justify='space-between' mt={'md'}>
				<Button variant='subtle' onClick={onBack}>
					Back
				</Button>
				<Button
					onClick={handleConfirm}
					disabled={!isComplete}
					leftSection={<IconCheck size='1rem' />}
				>
					Continue
				</Button>
			</Group>
		</Stack>
	);
}
