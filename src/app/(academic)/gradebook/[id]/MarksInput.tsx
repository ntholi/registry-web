'use client';

import { Box, Group, Text, TextInput } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { assessmentMarks, moduleGrades } from '@/db/schema';
import { calculateModuleGrade } from '@/lib/utils/gradeCalculations';
import {
	createAssessmentMark,
	updateAssessmentMark,
} from '@/server/assessment-marks/actions';

type AssessmentMark = typeof assessmentMarks.$inferSelect;
type ModuleGrade = typeof moduleGrades.$inferSelect;

type Props = {
	assessment: { id: number; maxMarks: number; totalMarks: number };
	studentId: number;
	existingMark?: number;
	existingMarkId?: number;
	moduleId: number;
};

export default function MarksInput({
	assessment,
	studentId,
	existingMark,
	existingMarkId,
	moduleId,
}: Props) {
	const [mark, setMark] = useState(existingMark?.toString() || '');
	const [isEditing, setIsEditing] = useState(false);
	const [error, setError] = useState('');
	const [pendingMark, setPendingMark] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);
	const markMutation = useMutation({
		mutationFn: async (data: {
			assessmentId: number;
			stdNo: number;
			marks: number;
		}) => {
			let result: AssessmentMark;
			if (existingMarkId !== undefined) {
				console.log('Updating existing mark:', existingMarkId, data);
				result = await updateAssessmentMark(existingMarkId, data, moduleId);
			} else {
				result = await createAssessmentMark(data, moduleId);
			}
			return result;
		},
		onMutate: async (newMark) => {
			await queryClient.cancelQueries({
				queryKey: ['assessmentMarks', moduleId],
			});
			await queryClient.cancelQueries({
				queryKey: ['moduleGrades', moduleId],
			});
			await queryClient.cancelQueries({
				queryKey: ['moduleGrade', moduleId, studentId],
			});

			const previousAssessmentMarks = queryClient.getQueryData([
				'assessmentMarks',
				moduleId,
			]);
			const previousModuleGrades = queryClient.getQueryData([
				'moduleGrades',
				moduleId,
			]);
			const previousModuleGrade = queryClient.getQueryData([
				'moduleGrade',
				moduleId,
				studentId,
			]);

			queryClient.setQueryData(
				['assessmentMarks', moduleId],
				(old: AssessmentMark[]) => {
					if (!old) return old;

					if (existingMarkId !== undefined) {
						return old.map((mark) =>
							mark.id === existingMarkId
								? { ...mark, marks: newMark.marks }
								: mark
						);
					} else {
						return [
							...old,
							{
								id: Date.now(),
								assessmentId: newMark.assessmentId,
								stdNo: newMark.stdNo,
								marks: newMark.marks,
								createdAt: new Date(),
							},
						];
					}
				}
			);

			const assessments = queryClient.getQueryData(['assessments', moduleId]) as
				| Array<{
						id: number;
						weight: number;
						totalMarks: number;
				  }>
				| undefined;

			if (assessments) {
				const updatedAssessmentMarks = queryClient.getQueryData([
					'assessmentMarks',
					moduleId,
				]) as AssessmentMark[];

				const studentMarks =
					updatedAssessmentMarks?.filter((mark) => mark.stdNo === studentId) ||
					[];

				const gradeCalculation = calculateModuleGrade(
					assessments.map((a) => ({
						id: a.id,
						weight: a.weight,
						totalMarks: a.totalMarks,
					})),
					studentMarks.map((m) => ({
						assessment_id: m.assessmentId,
						marks: m.marks,
					}))
				);

				if (gradeCalculation.hasMarks) {
					const newModuleGrade = {
						id: Date.now(),
						moduleId,
						stdNo: studentId,
						grade: gradeCalculation.grade,
						weightedTotal: gradeCalculation.weightedTotal,
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					queryClient.setQueryData(
						['moduleGrade', moduleId, studentId],
						newModuleGrade
					);

					queryClient.setQueryData(
						['moduleGrades', moduleId],
						(old: ModuleGrade[]) => {
							if (!old) return [newModuleGrade];

							const existingIndex = old.findIndex(
								(grade) => grade.stdNo === studentId
							);

							if (existingIndex >= 0) {
								const updated = [...old];
								updated[existingIndex] = newModuleGrade;
								return updated;
							} else {
								return [...old, newModuleGrade];
							}
						}
					);
				}
			}

			return {
				previousAssessmentMarks,
				previousModuleGrades,
				previousModuleGrade,
			};
		},
		onSuccess: async () => {
			setError('');
			queryClient.invalidateQueries({
				queryKey: ['assessmentMarks', moduleId],
			});

			queryClient.invalidateQueries({
				queryKey: ['moduleGrades', moduleId],
			});

			queryClient.invalidateQueries({
				queryKey: ['moduleGrade', moduleId, studentId],
			});
		},
		onError: (_error, _newMark, context) => {
			if (context?.previousAssessmentMarks) {
				queryClient.setQueryData(
					['assessmentMarks', moduleId],
					context.previousAssessmentMarks
				);
			}
			if (context?.previousModuleGrades) {
				queryClient.setQueryData(
					['moduleGrades', moduleId],
					context.previousModuleGrades
				);
			}
			if (context?.previousModuleGrade) {
				queryClient.setQueryData(
					['moduleGrade', moduleId, studentId],
					context.previousModuleGrade
				);
			}

			setPendingMark(null);
			setMark(existingMark?.toString() || '');
			setError('Failed to save mark. Please try again.');
		},
	});

	useEffect(() => {
		if (existingMark !== undefined && !markMutation.isPending) {
			setMark(existingMark.toString());
			if (pendingMark !== null && existingMark === pendingMark) {
				setPendingMark(null);
			}
		}
	}, [existingMark, pendingMark, markMutation.isPending]);

	const handleMarkChange = (value: string) => {
		setMark(value);
		setError('');
	};
	const saveMarks = () => {
		if (mark.trim() === '') {
			setIsEditing(false);
			setMark(existingMark?.toString() || '');
			return;
		}

		const numericMark = parseFloat(mark);

		if (Number.isNaN(numericMark)) {
			setError('Invalid number');
			return;
		}

		const maxPossible = assessment.maxMarks || 100;

		if (numericMark < 0 || numericMark > maxPossible) {
			setError(`Mark must be between 0-${maxPossible}`);
			return;
		}

		markMutation.mutate({
			assessmentId: assessment.id,
			stdNo: studentId,
			marks: numericMark,
		});

		setPendingMark(numericMark);
		setIsEditing(false);
	};

	const handleBlur = () => {
		saveMarks();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			inputRef.current?.blur();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setMark(existingMark?.toString() || '');
		setError('');
	};
	const getMarkStatus = () => {
		const currentMark = pendingMark ?? existingMark;
		if (currentMark === undefined) return null;
		const maxMarks = assessment.maxMarks || 100;
		const percentage = (currentMark / maxMarks) * 100;
		return percentage >= 50 ? 'green' : 'red';
	};

	const markDisplay = pendingMark ?? existingMark ?? '-';
	const maxMark = assessment.maxMarks || assessment.totalMarks;
	const statusColor = getMarkStatus();

	return (
		<Box pos='relative'>
			<Box
				pos='relative'
				style={{ cursor: 'pointer', display: isEditing ? 'none' : undefined }}
				onClick={() => {
					setIsEditing(true);
					setError('');
				}}
			>
				<Group gap={2} justify='center' align='end'>
					<Text fw={600} c={statusColor || undefined} size='sm'>
						{markDisplay}
					</Text>
					<Text size='xs' c='dimmed'>
						/{maxMark}
					</Text>
				</Group>
				{error && (
					<Text size='xs' c='red' ta='center' mt={2}>
						{error}
					</Text>
				)}
			</Box>
			<Box style={{ display: isEditing ? undefined : 'none' }}>
				<Group align='center' gap={4} justify='center'>
					<TextInput
						ref={inputRef}
						size='xs'
						value={mark}
						onChange={(e) => handleMarkChange(e.target.value)}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						error={error}
						placeholder='Marks'
						styles={{
							input: {
								width: '90px',
								textAlign: 'center',
								fontWeight: 500,
							},
							error: {
								position: 'absolute',
								width: '100%',
								textAlign: 'center',
								top: '100%',
								left: '0',
								whiteSpace: 'nowrap',
								zIndex: 10,
							},
						}}
					/>
				</Group>
			</Box>
		</Box>
	);
}
