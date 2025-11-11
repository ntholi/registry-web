'use client';

import { Button, Group, NumberInput, Select, Stack } from '@mantine/core';
import { useState } from 'react';
import {
	getGradeByMarks,
	getGradeByPoints,
	getGradeBySymbol,
	grades,
} from '@/lib/utils/grades';
import { GradeResultDisplay } from './GradeResultDisplay';

type InputType = 'marks' | 'points' | 'grade';

type GradeResult = {
	grade: string;
	points: number | null;
	description: string;
	marksRange?: { min: number; max: number };
};

export function GradeCalculatorForm() {
	const [inputType, setInputType] = useState<InputType>('marks');
	const [marksInput, setMarksInput] = useState<number | string>('');
	const [pointsInput, setPointsInput] = useState<number | string>('');
	const [gradeInput, setGradeInput] = useState<string>('');
	const [result, setResult] = useState<GradeResult | null>(null);

	const clearForm = () => {
		setMarksInput('');
		setPointsInput('');
		setGradeInput('');
		setResult(null);
	};

	// Auto-calculate when input changes
	const handleMarksChange = (value: number | string) => {
		setMarksInput(value);
		if (typeof value === 'number') {
			const gradeResult = getGradeByMarks(value);
			if (gradeResult) {
				setResult({
					grade: gradeResult.grade,
					points: gradeResult.points,
					description: gradeResult.description,
					marksRange: gradeResult.marksRange,
				});
			} else {
				setResult(null);
			}
		} else {
			setResult(null);
		}
	};

	const handlePointsChange = (value: number | string) => {
		setPointsInput(value);
		if (typeof value === 'number') {
			const gradeResult = getGradeByPoints(value);
			if (gradeResult) {
				setResult({
					grade: gradeResult.grade,
					points: gradeResult.points,
					description: gradeResult.description,
					marksRange: gradeResult.marksRange,
				});
			} else {
				setResult(null);
			}
		} else {
			setResult(null);
		}
	};

	const handleGradeChange = (value: string | null) => {
		const gradeValue = value || '';
		setGradeInput(gradeValue);
		if (gradeValue) {
			const gradeResult = getGradeBySymbol(gradeValue);
			if (gradeResult) {
				setResult({
					grade: gradeResult.grade,
					points: gradeResult.points,
					description: gradeResult.description,
					marksRange: gradeResult.marksRange,
				});
			} else {
				setResult(null);
			}
		} else {
			setResult(null);
		}
	};

	const gradeOptions = grades
		.filter(
			(grade, index, array) =>
				array.findIndex((g) => g.grade === grade.grade) === index
		)
		.map((g) => ({
			value: g.grade,
			label: `${g.grade}`,
		}));

	return (
		<Stack gap='lg'>
			<Group align='flex-end'>
				<Select
					label='Input Type'
					value={inputType}
					onChange={(value) => {
						setInputType(value as InputType);
						clearForm();
					}}
					data={[
						{ value: 'marks', label: 'Marks' },
						{ value: 'points', label: 'Grade Points' },
						{ value: 'grade', label: 'Grade Symbol' },
					]}
					style={{ flex: 1 }}
				/>

				{inputType === 'marks' && (
					<NumberInput
						label='Enter Marks'
						placeholder='0-100'
						value={marksInput}
						onChange={handleMarksChange}
						min={0}
						max={100}
						allowDecimal={false}
						style={{ flex: 2 }}
					/>
				)}

				{inputType === 'points' && (
					<NumberInput
						label='Enter Grade Points'
						placeholder='0.0-4.0'
						value={pointsInput}
						onChange={handlePointsChange}
						min={0}
						max={4}
						step={0.01}
						decimalScale={2}
						style={{ flex: 2 }}
					/>
				)}

				{inputType === 'grade' && (
					<Select
						label='Select Grade'
						placeholder='Choose grade'
						value={gradeInput}
						onChange={handleGradeChange}
						data={gradeOptions}
						searchable
						style={{ flex: 2 }}
					/>
				)}

				<Button variant='outline' onClick={clearForm}>
					Clear
				</Button>
			</Group>

			{result && <GradeResultDisplay result={result} />}
		</Stack>
	);
}
