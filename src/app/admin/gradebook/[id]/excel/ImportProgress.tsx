'use client';

import { Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  calculateAndSaveModuleGrade,
  createOrUpdateMarks,
} from '@/server/assessment-marks/actions';
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
  const [currentRecord, setCurrentRecord] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [currentStudentNo, setCurrentStudentNo] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const validRows = rows.filter((row) => row.isValid);
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      setImportProgress(0);
      setTotalRecords(validRows.length);
      setCurrentRecord(0);

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const currentRecordNum = i + 1;
        setCurrentRecord(currentRecordNum);
        setCurrentStudentNo(row.studentNumber);
        setImportProgress((currentRecordNum / validRows.length) * 100);

        try {
          setCurrentAction(`Verifying student ${row.studentNumber}...`);

          for (const [assessmentId, marks] of Object.entries(
            row.assessmentMarks,
          )) {
            setCurrentAction(
              `Updating marks for student ${row.studentNumber}...`,
            );
            await createOrUpdateMarks({
              assessmentId: parseInt(assessmentId),
              stdNo: parseInt(row.studentNumber),
              marks,
            });
          }

          setCurrentAction(
            `Calculating grade for student ${row.studentNumber}...`,
          );
          await calculateAndSaveModuleGrade(
            moduleId,
            parseInt(row.studentNumber),
          );
          imported++;
        } catch (error) {
          failed++;
          errors.push(
            `Row ${row.rowIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      setCurrentAction('Import completed');
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
            </Group>
            <Group justify='space-between'>
              <Text size='xs' c='dimmed'>
                {currentRecord}/{totalRecords} records processed
              </Text>
              {currentStudentNo && (
                <Text size='xs' c='dimmed'>
                  Student: {currentStudentNo}
                </Text>
              )}
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
