'use client';

import {
  Alert,
  Button,
  FileInput,
  Group,
  Modal,
  Stack,
  Stepper,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconCheck,
  IconDatabase,
  IconFileCheck,
  IconFileImport,
  IconTable,
  IconUpload,
} from '@tabler/icons-react';
import { useCallback, useState } from 'react';

import AssessmentMapping from './AssessmentMapping';
import { ColumnDetector } from './ColumnDetector';
import { ExcelParser } from './ExcelParser';
import ImportPreview from './ImportPreview';
import ImportProgress from './ImportProgress';
import SheetSelector from './SheetSelector';
import type {
  AssessmentInfo,
  ColumnMapping,
  DetectedColumns,
  ExcelData,
  ExcelWorkbook,
  ImportResult,
  ParsedRow,
} from './types';

interface Props {
  moduleId: number;
  assessments: AssessmentInfo[];
}

export default function ExcelImport({ moduleId, assessments }: Props) {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<ExcelWorkbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [detectedColumns, setDetectedColumns] =
    useState<DetectedColumns | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
    null,
  );
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setWorkbook(null);
      setSelectedSheet(null);
      setExcelData(null);
      setDetectedColumns(null);
      return;
    }
    try {
      setFile(selectedFile);
      const workbookData = await ExcelParser.parseFile(selectedFile);
      setWorkbook(workbookData);

      if (workbookData.sheetNames.length === 1) {
        const sheetName = workbookData.sheetNames[0];
        setSelectedSheet(sheetName);

        const data = workbookData.sheets[sheetName];
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
      }
    } catch (error) {
      notifications.show({
        title: 'File Parse Error',
        message:
          error instanceof Error ? error.message : 'Failed to parse Excel file',
        color: 'red',
      });
    }
  };
  const handleSheetSelect = (sheetName: string) => {
    if (!workbook) return;

    try {
      setSelectedSheet(sheetName);
      const data = workbook.sheets[sheetName];
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
        title: 'Sheet Parse Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to parse selected sheet',
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

  const handleImportComplete = useCallback((result: ImportResult) => {
    setImportResult(result);
    setActiveStep(3);
  }, []);

  const handleImportError = useCallback((error: Error) => {
    console.error('Import failed:', error);
  }, []);
  const resetImport = () => {
    setActiveStep(0);
    setFile(null);
    setWorkbook(null);
    setSelectedSheet(null);
    setExcelData(null);
    setDetectedColumns(null);
    setColumnMapping(null);
    setParsedRows([]);
    setImportResult(null);
  };
  const handleClose = () => {
    resetImport();
    close();
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

                {workbook && workbook.sheetNames.length > 1 && (
                  <SheetSelector
                    sheetNames={workbook.sheetNames}
                    selectedSheet={selectedSheet}
                    onSheetSelect={handleSheetSelect}
                  />
                )}

                {excelData && (
                  <Alert icon={<IconCheck size={16} />} color='green'>
                    File loaded successfully: {excelData.rows.length} rows,
                    {excelData.headers.length} columns
                    {selectedSheet && ` from sheet "${selectedSheet}"`}
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
              {excelData && columnMapping && (
                <>
                  <ImportPreview
                    excelData={excelData}
                    columnMapping={columnMapping}
                    assessments={assessments}
                    moduleId={moduleId}
                    onPreviewGenerated={handlePreviewGenerated}
                    onBack={() => setActiveStep(1)}
                  />
                  <ImportProgress
                    parsedRows={parsedRows}
                    moduleId={moduleId}
                    onImportComplete={handleImportComplete}
                    onImportError={handleImportError}
                    onBack={() => setActiveStep(1)}
                  />
                </>
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
                          Import
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
          </Stepper>
          {activeStep < 3 && activeStep !== 2 && activeStep !== 1 && (
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
