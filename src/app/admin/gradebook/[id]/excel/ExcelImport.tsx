'use client';

import { useState, useCallback } from 'react';
import {
  Button,
  Modal,
  Stepper,
  Group,
  Text,
  Stack,
  FileInput,
  Alert,
  Progress,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconFileImport,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconUpload,
  IconTable,
  IconFileCheck,
  IconDatabase,
} from '@tabler/icons-react';

import { ExcelParser } from './ExcelParser';
import { ColumnDetector } from './ColumnDetector';
import AssessmentMapping from './AssessmentMapping';
import ImportPreview from './ImportPreview';
import {
  createOrUpdateMarks,
  calculateAndSaveModuleGrade,
} from '@/server/assessment-marks/actions';
import { ASSESSMENT_TYPES } from '@/app/admin/assessments/[id]/assessments';
import type {
  ExcelData,
  ColumnMapping,
  DetectedColumns,
  ParsedRow,
  ImportResult,
  AssessmentInfo,
} from './types';

interface Props {
  moduleId: number;
  assessments: AssessmentInfo[];
}

export default function ExcelImport({ moduleId, assessments }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [detectedColumns, setDetectedColumns] =
    useState<DetectedColumns | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
    null,
  );
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setExcelData(null);
      setDetectedColumns(null);
      return;
    }
    try {
      setFile(selectedFile);
      const data = await ExcelParser.parseFile(selectedFile);
      setExcelData(data);
      const detected = ColumnDetector.detectColumns(data, assessments);
      setDetectedColumns(detected);

      if (detected.confidence > 0.7) {
        setColumnMapping({
          studentNumberColumn: detected.studentNumberColumn,
          assessmentColumns: detected.assessmentColumns,
        });
      }
      setActiveStep(1);
    } catch (error) {
      notifications.show({
        title: 'File Parse Error',
        message:
          error instanceof Error ? error.message : 'Failed to parse Excel file',
        color: 'red',
      });
    }
  };
  const handleColumnMappingConfirm = useCallback((mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setActiveStep(2);
  }, []);
  const handlePreviewGenerated = useCallback((rows: ParsedRow[]) => {
    setParsedRows(rows);
  }, []);

  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const validRows = rows.filter((row) => row.isValid);
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      setIsImporting(true);
      setImportProgress(0);

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        setImportProgress(((i + 1) / validRows.length) * 100);
        try {
          for (const [assessmentId, marks] of Object.entries(
            row.assessmentMarks,
          )) {
            await createOrUpdateMarks({
              assessmentId: parseInt(assessmentId),
              stdNo: parseInt(row.studentNumber),
              marks,
            });
          }

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

      return {
        success: failed === 0,
        imported,
        failed,
        errors,
      };
    },
    onSuccess: (result) => {
      setImportResult(result);
      setIsImporting(false);
      setActiveStep(3);

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
    },
    onError: (error) => {
      setIsImporting(false);
      notifications.show({
        title: 'Import Failed',
        message:
          error instanceof Error ? error.message : 'Failed to import data',
        color: 'red',
      });
    },
  });
  const handleImport = useCallback(() => {
    if (parsedRows.length > 0) {
      importMutation.mutate(parsedRows);
    }
  }, [parsedRows, importMutation]);

  const resetImport = () => {
    setActiveStep(0);
    setFile(null);
    setExcelData(null);
    setDetectedColumns(null);
    setColumnMapping(null);
    setParsedRows([]);
    setImportProgress(0);
    setIsImporting(false);
    setImportResult(null);
  };

  const handleClose = () => {
    if (!isImporting) {
      resetImport();
      close();
    }
  };

  return (
    <>
      <Button
        leftSection={<IconFileImport size={'1rem'} />}
        variant='light'
        onClick={open}
      >
        Import from Excel
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title='Import Assessment Marks from Excel'
        size='xl'
        closeOnClickOutside={!isImporting}
        withCloseButton={!isImporting}
      >
        <Stack gap='md'>
          <Stepper active={activeStep} size='sm' allowNextStepsSelect={false}>
            <Stepper.Step
              label='Upload File'
              description='Select Excel file'
              icon={<IconUpload size={18} />}
              completedIcon={<IconCheck size={18} />}
            >
              <Stack gap='md' py='md'>
                <FileInput
                  label='Select Excel File'
                  placeholder='Choose .xlsx or .xls file'
                  accept='.xlsx,.xls'
                  value={file}
                  onChange={handleFileSelect}
                  leftSection={<IconFileImport size={16} />}
                />

                {excelData && (
                  <Alert icon={<IconCheck size={16} />} color='green'>
                    File loaded successfully: {excelData.rows.length} rows,{' '}
                    {excelData.headers.length} columns
                  </Alert>
                )}
              </Stack>
            </Stepper.Step>

            <Stepper.Step
              label='Map Columns'
              description='Verify column mapping'
              icon={<IconTable size={18} />}
              completedIcon={<IconCheck size={18} />}
            >
              {' '}
              {excelData && detectedColumns && (
                <AssessmentMapping
                  excelData={excelData}
                  detectedColumns={detectedColumns}
                  assessments={assessments}
                  onConfirm={handleColumnMappingConfirm}
                  onBack={() => setActiveStep(0)}
                />
              )}
            </Stepper.Step>

            <Stepper.Step
              label='Preview & Import'
              description='Review data before import'
              icon={<IconFileCheck size={18} />}
              completedIcon={<IconCheck size={18} />}
            >
              {' '}
              {excelData && columnMapping && (
                <ImportPreview
                  excelData={excelData}
                  columnMapping={columnMapping}
                  assessments={assessments}
                  onPreviewGenerated={handlePreviewGenerated}
                  onImport={handleImport}
                  onBack={() => setActiveStep(1)}
                  isImporting={isImporting}
                />
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
                    <Progress value={importProgress} animated />
                  </Stack>
                </Paper>
              )}
            </Stepper.Step>

            <Stepper.Step
              label='Complete'
              description='Import results'
              icon={<IconDatabase size={18} />}
              completedIcon={<IconCheck size={18} />}
            >
              {importResult && (
                <Stack gap='md' py='md'>
                  <Alert
                    icon={
                      importResult.success ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconAlertCircle size={16} />
                      )
                    }
                    color={importResult.success ? 'green' : 'orange'}
                  >
                    <Group justify='space-between'>
                      <div>
                        <Text fw={500}>
                          Import{' '}
                          {importResult.success
                            ? 'Completed'
                            : 'Completed with Errors'}
                        </Text>
                        <Text size='sm'>
                          {importResult.imported} records imported successfully
                          {importResult.failed > 0 &&
                            `, ${importResult.failed} failed`}
                        </Text>
                      </div>
                    </Group>
                  </Alert>

                  {importResult.errors.length > 0 && (
                    <Alert icon={<IconAlertCircle size={16} />} color='red'>
                      <Text fw={500} mb='xs'>
                        Import Errors:
                      </Text>
                      <Stack gap={4}>
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <Text key={index} size='sm'>
                            • {error}
                          </Text>
                        ))}
                        {importResult.errors.length > 5 && (
                          <Text size='sm' c='dimmed'>
                            ... and {importResult.errors.length - 5} more errors
                          </Text>
                        )}
                      </Stack>
                    </Alert>
                  )}

                  <Group justify='center'>
                    <Button onClick={handleClose}>Close</Button>
                    <Button variant='light' onClick={resetImport}>
                      Import Another File
                    </Button>
                  </Group>
                </Stack>
              )}
            </Stepper.Step>
          </Stepper>{' '}
          {activeStep < 3 &&
            !isImporting &&
            activeStep !== 2 &&
            activeStep !== 1 && (
              <Group justify='space-between'>
                <Button
                  variant='subtle'
                  onClick={
                    activeStep > 0
                      ? () => setActiveStep(activeStep - 1)
                      : handleClose
                  }
                >
                  {activeStep > 0 ? 'Back' : 'Cancel'}
                </Button>
              </Group>
            )}
        </Stack>
      </Modal>
    </>
  );
}
