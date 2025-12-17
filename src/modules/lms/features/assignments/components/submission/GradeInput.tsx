'use client';

import { Box, Group, Text, TextInput } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
	getAssignmentGrades,
	saveAssignmentGrade,
} from './viewer/server/actions';

type Props = {
	assignmentId: number;
	userId: number;
	maxGrade: number;
	existingGrade?: number;
};

export default function GradeInput({
	assignmentId,
	userId,
	maxGrade,
	existingGrade,
}: Props) {
	const { data: grades } = useQuery({
		queryKey: ['assignment-grades', assignmentId],
		queryFn: () => getAssignmentGrades(assignmentId),
		staleTime: 0,
		refetchOnMount: 'always',
	});

	const currentGrade = grades?.get(userId) ?? existingGrade;

	const [grade, setGrade] = useState(currentGrade?.toString() || '');
	const [isEditing, setIsEditing] = useState(false);
	const [error, setError] = useState('');
	const [pendingGrade, setPendingGrade] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const gradeMutation = useMutation({
		mutationFn: async (newGrade: number) => {
			await saveAssignmentGrade(assignmentId, userId, newGrade);
			return newGrade;
		},
		onMutate: async (newGrade) => {
			await queryClient.cancelQueries({
				queryKey: ['assignment-grades', assignmentId],
			});

			const previousGrades = queryClient.getQueryData([
				'assignment-grades',
				assignmentId,
			]);

			queryClient.setQueryData(
				['assignment-grades', assignmentId],
				(old: Map<number, number> | undefined) => {
					const newMap = new Map(old || []);
					newMap.set(userId, newGrade);
					return newMap;
				}
			);

			return { previousGrades };
		},
		onSuccess: () => {
			setError('');
			queryClient.invalidateQueries({
				queryKey: ['assignment-grades', assignmentId],
			});
		},
		onError: (_error, _newGrade, context) => {
			if (context?.previousGrades) {
				queryClient.setQueryData(
					['assignment-grades', assignmentId],
					context.previousGrades
				);
			}
			setPendingGrade(null);
			setGrade(currentGrade?.toString() || '');
			setError('Failed to save grade');
		},
	});

	useEffect(() => {
		if (currentGrade !== undefined && !gradeMutation.isPending) {
			setGrade(currentGrade.toString());
			if (pendingGrade !== null && currentGrade === pendingGrade) {
				setPendingGrade(null);
			}
		}
	}, [currentGrade, pendingGrade, gradeMutation.isPending]);

	function handleGradeChange(value: string) {
		setGrade(value);
		setError('');
	}

	function saveGrade() {
		if (grade.trim() === '') {
			setIsEditing(false);
			setGrade(currentGrade?.toString() || '');
			return;
		}

		const numericGrade = Number.parseFloat(grade);

		if (Number.isNaN(numericGrade)) {
			setError('Invalid number');
			return;
		}

		if (numericGrade < 0 || numericGrade > maxGrade) {
			setError(`Grade must be 0-${maxGrade}`);
			return;
		}

		gradeMutation.mutate(numericGrade);
		setPendingGrade(numericGrade);
		setIsEditing(false);
	}

	function handleBlur() {
		saveGrade();
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			inputRef.current?.blur();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	function cancelEdit() {
		setIsEditing(false);
		setGrade(currentGrade?.toString() || '');
		setError('');
	}

	function getGradeStatus() {
		const displayGrade = pendingGrade ?? currentGrade;
		if (displayGrade === undefined) return null;
		const percentage = (displayGrade / maxGrade) * 100;
		return percentage >= 50 ? 'green' : 'red';
	}

	const gradeDisplay = pendingGrade ?? currentGrade ?? '-';
	const statusColor = getGradeStatus();

	return (
		<Box pos='relative' h={50}>
			<Text size='xs' ta={'right'} fw={500} mb={4}>
				Grade
			</Text>
			<Box
				pos='relative'
				style={{ cursor: 'pointer', display: isEditing ? 'none' : undefined }}
				onClick={() => {
					setIsEditing(true);
					setError('');
				}}
			>
				<Group gap={4} justify='flex-start' align='end'>
					<Text fw={600} c={statusColor || undefined} size='md'>
						{gradeDisplay}
					</Text>
					<Text size='sm' c='dimmed'>
						/{maxGrade}
					</Text>
				</Group>
				{error && (
					<Text size='xs' c='red' mt={2}>
						{error}
					</Text>
				)}
			</Box>
			<Box style={{ display: isEditing ? undefined : 'none' }}>
				<Group align='center' gap={6}>
					<TextInput
						ref={inputRef}
						size='sm'
						value={grade}
						onChange={(e) => handleGradeChange(e.target.value)}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						error={error}
						placeholder='Grade'
						styles={{
							input: {
								width: '80px',
								textAlign: 'center',
								fontWeight: 500,
							},
							error: {
								position: 'absolute',
								width: '100%',
								textAlign: 'left',
								top: '100%',
								left: '0',
								whiteSpace: 'nowrap',
								zIndex: 10,
							},
						}}
					/>
					<Text size='sm' c='dimmed'>
						/{maxGrade}
					</Text>
				</Group>
			</Box>
		</Box>
	);
}
