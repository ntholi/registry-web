'use client';

import { Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { createOrUpdateMarksInBulk } from '@/server/assessment-marks/actions';
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
  const [importProgress, setImportProgress] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const validRows = rows.filter((row) => row.isValid);
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];
      setImportProgress(0);
      setTotalRecords(validRows.length);
      try {
        setCurrentAction('Preparing bulk import...');
        setImportProgress(10);

        const bulkData: Array<{
          assessmentId: number;
          stdNo: number;
          marks: number;
        }> = [];

        for (const row of validRows) {
          for (const [assessmentId, marks] of Object.entries(
            row.assessmentMarks,
          )) {
            bulkData.push({
              assessmentId: parseInt(assessmentId),
              stdNo: parseInt(row.studentNumber),
              marks,
            });
          }
        }
        setCurrentAction(
          `Processing ${bulkData.length} marks for ${validRows.length} students...`,
        );
        setImportProgress(30);

        const bulkResult = await createOrUpdateMarksInBulk(bulkData, moduleId);

        setCurrentAction('Finalizing import...');
        setImportProgress(90);

        setCurrentAction('Import completed successfully');
        setImportProgress(100);

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
          `Bulk import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        error instanceof Error ? error : new Error('Import failed'),
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
      )}

      {isImporting && (
        <Paper p='md' withBorder>
          <Stack gap='xs'>
            <Group justify='space-between'>
              <Text size='sm' fw={500}>
                Importing data...
              </Text>
              <Text size='sm'>{Math.round(importProgress)}%</Text>
            </Group>{' '}
            <Group justify='space-between'>
              <Text size='xs' c='dimmed'>
                {totalRecords} records to process
              </Text>
            </Group>
            <Progress value={importProgress} animated />
            {currentAction && (
              <Text size='xs' c='blue' style={{ fontStyle: 'italic' }}>
                {currentAction}
              </Text>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
