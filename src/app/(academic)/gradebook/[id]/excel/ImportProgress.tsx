'use client';

import { Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { createOrUpdateMarksInBulk } from '@/server/academic/assessment-marks/actions';
import type { ImportResult, ParsedRow } from './types';

interface Props {
	parsedRows: ParsedRow[];
	moduleId: number;
	onImportComplete: (result: ImportResult) => void;
	onImportError: (error: Error) => void;
	onBack: () => void;
}

export default function ImportProgress({
	parsedRows,
	moduleId,
	onImportComplete,
	onImportError,
	onBack,
}: Props) {
	const [totalRecords, setTotalRecords] = useState(0);
	const queryClient = useQueryClient();
	const importMutation = useMutation({
		mutationFn: async (rows: ParsedRow[]) => {
			const validRows = rows.filter((row) => row.isValid && row.isRegistered);
			let imported = 0;
			let failed = 0;
			const errors: string[] = [];
			setTotalRecords(validRows.length);
			try {
				const bulkData: Array<{
					assessmentId: number;
					stdNo: number;
					marks: number;
				}> = [];

				for (const row of validRows) {
					for (const [assessmentId, marks] of Object.entries(
						row.assessmentMarks
					)) {
						bulkData.push({
							assessmentId: parseInt(assessmentId, 10),
							stdNo: parseInt(row.studentNumber, 10),
							marks,
						});
					}
				}

				const bulkResult = await createOrUpdateMarksInBulk(bulkData, moduleId);

				if (bulkResult.errors && bulkResult.errors.length > 0) {
					errors.push(...bulkResult.errors);
					failed = bulkResult.failed || 0;
					imported = bulkResult.successful || 0;
				} else {
					imported = validRows.length;
				}
			} catch (error) {
				failed = validRows.length;
				errors.push(
					`Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}

			return {
				success: failed === 0,
				imported,
				failed,
				errors,
			};
		},
		onSuccess: (result) => {
			queryClient.invalidateQueries({
				queryKey: ['assessmentMarks', moduleId],
			});
			queryClient.invalidateQueries({
				queryKey: ['moduleGrades', moduleId],
			});

			notifications.show({
				title: 'Import Complete',
				message: `Successfully imported ${result.imported} records${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
				color: result.success ? 'green' : 'orange',
			});

			onImportComplete(result);
		},
		onError: (error) => {
			notifications.show({
				title: 'Import Failed',
				message:
					error instanceof Error ? error.message : 'Failed to import data',
				color: 'red',
			});
			onImportError(
				error instanceof Error ? error : new Error('Import failed')
			);
		},
	});

	const handleImport = useCallback(() => {
		if (parsedRows.length > 0) {
			importMutation.mutate(parsedRows);
		}
	}, [parsedRows, importMutation]);

	const isImporting = importMutation.isPending;
	return (
		<Stack gap='md' py='md'>
			{!isImporting && parsedRows.length > 0 && (
				<Group justify='space-between'>
					<Button variant='subtle' onClick={onBack}>
						Back
					</Button>
					<Button
						onClick={handleImport}
						disabled={parsedRows.length === 0}
						loading={isImporting}
					>
						Start Import
					</Button>
				</Group>
			)}{' '}
			{isImporting && (
				<Paper p='md' withBorder>
					<Stack gap='xs'>
						<Text size='sm' fw={500}>
							Importing data
						</Text>
						<Text size='xs' c='dimmed'>
							Processing {totalRecords} student records, this may take a
							while...
						</Text>
						<Progress value={100} animated striped />
					</Stack>
				</Paper>
			)}
		</Stack>
	);
}
