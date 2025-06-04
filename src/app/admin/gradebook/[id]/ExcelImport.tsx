'use client';

import { useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  FileInput,
  Table,
  Alert,
  Progress,
  Badge,
  Paper,
  ScrollArea,
  ActionIcon,
  Tooltip,
  TextInput,
  Card,
  Divider,
} from '@mantine/core';
import {
  IconFileSpreadsheet,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconEye,
  IconWand,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import {
  createAssessmentMark,
  updateAssessmentMark,
  calculateAndSaveModuleGrade,
} from '@/server/assessment-marks/actions';
import { ASSESSMENT_TYPES } from '@/app/admin/assessments/[id]/assessments';

type Props = {
  opened: boolean;
  onClose: () => void;
  moduleId: number;
  assessments: Array<{
    id: number;
    assessmentNumber: string;
    assessmentType: string;
    totalMarks: number;
    weight: number;
  }>;
  existingMarks: Array<{
    id: number;
    assessmentId: number;
    stdNo: number;
    marks: number;
  }>;
};

type ImportRow = {
  rowNumber: number;
  studentNumber: string;
  marks: Record<string, number | undefined>;
  status: 'pending' | 'success' | 'error';
  errors: string[];
};

interface ColumnDetection {
  studentNumberColumn: string | null;
  assessmentColumns: Record<number, string>;
  detectedColumns: Array<{
    letter: string;
    index: number;
    header: string;
    type: 'student' | 'assessment' | 'unknown';
    assessmentId?: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
}

const indexToLetter = (index: number): string => {
  let result = '';
  while (index >= 0) {
    result = String.fromCharCode(65 + (index % 26)) + result;
    index = Math.floor(index / 26) - 1;
  }
  return result;
};

const letterToIndex = (letter: string): number => {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
};

const isValidStudentNumber = (value: string): boolean => {
  const cleaned = String(value).trim();
  return /^9010\d{5}$/.test(cleaned);
};

const detectColumns = (
  excelData: any[][],
  assessments: Props['assessments'],
): ColumnDetection => {
  if (excelData.length === 0) {
    return {
      studentNumberColumn: null,
      assessmentColumns: {},
      detectedColumns: [],
    };
  }

  const headers = excelData[0] || [];
  const dataRows = excelData.slice(1, 11);
  const detectedColumns: ColumnDetection['detectedColumns'] = [];

  headers.forEach((header: any, index: number) => {
    const headerStr = String(header || '').trim();
    const letter = indexToLetter(index);

    let type: 'student' | 'assessment' | 'unknown' = 'unknown';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let assessmentId: number | undefined;

    const columnData = dataRows.map((row) => String(row[index] || '').trim());
    const validStudentNumbers = columnData.filter(isValidStudentNumber);

    if (validStudentNumbers.length >= Math.min(3, dataRows.length * 0.7)) {
      type = 'student';
      confidence =
        validStudentNumbers.length === dataRows.length ? 'high' : 'medium';
    } else {
      const matchedAssessment = assessments.find((assessment) => {
        const assessmentTypeLabel =
          ASSESSMENT_TYPES.find(
            (type) => type.value === assessment.assessmentType,
          )?.label || assessment.assessmentType;

        const headerLower = headerStr.toLowerCase();
        const labelLower = assessmentTypeLabel.toLowerCase();
        const numberLower = assessment.assessmentNumber.toLowerCase();

        return (
          headerLower === labelLower ||
          headerLower.includes(labelLower) ||
          labelLower.includes(headerLower) ||
          headerLower.includes(numberLower) ||
          headerLower === numberLower
        );
      });

      if (matchedAssessment) {
        type = 'assessment';
        assessmentId = matchedAssessment.id;

        const assessmentTypeLabel =
          ASSESSMENT_TYPES.find(
            (type) => type.value === matchedAssessment.assessmentType,
          )?.label || matchedAssessment.assessmentType;

        if (headerStr.toLowerCase() === assessmentTypeLabel.toLowerCase()) {
          confidence = 'high';
        } else {
          confidence = 'medium';
        }
      }
    }

    detectedColumns.push({
      letter,
      index,
      header: headerStr,
      type,
      assessmentId,
      confidence,
    });
  });

  const studentColumns = detectedColumns.filter(
    (col) => col.type === 'student',
  );
  const studentNumberColumn =
    studentColumns.length > 0 ? studentColumns[0].letter : null;

  const assessmentColumns: Record<number, string> = {};
  detectedColumns
    .filter((col) => col.type === 'assessment' && col.assessmentId)
    .forEach((col) => {
      if (col.assessmentId) {
        assessmentColumns[col.assessmentId] = col.letter;
      }
    });

  return {
    studentNumberColumn,
    assessmentColumns,
    detectedColumns,
  };
};

export default function ExcelImport({
  opened,
  onClose,
  moduleId,
  assessments,
  existingMarks,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [detection, setDetection] = useState<ColumnDetection>({
    studentNumberColumn: null,
    assessmentColumns: {},
    detectedColumns: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<
    'upload' | 'mapping' | 'preview' | 'importing'
  >('upload');
  const queryClient = useQueryClient();
  const handleFileUpload = (uploadedFile: File | null) => {
    if (!uploadedFile) {
      setFile(null);
      setExcelData([]);
      setDetection({
        studentNumberColumn: null,
        assessmentColumns: {},
        detectedColumns: [],
      });
      setStep('upload');
      return;
    }

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as any[][];

        if (jsonData.length === 0) {
          notifications.show({
            title: 'Error',
            message: 'The Excel file appears to be empty',
            color: 'red',
          });
          return;
        }

        setExcelData(jsonData);
        const detectedColumns = detectColumns(jsonData, assessments);
        setDetection(detectedColumns);
        setStep('mapping');
      } catch (error) {
        notifications.show({
          title: 'Error',
          message:
            "Failed to parse Excel file. Please ensure it's a valid Excel file.",
          color: 'red',
        });
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const updateColumnMapping = (
    type: 'student' | 'assessment',
    value: string,
    assessmentId?: number,
  ) => {
    if (type === 'student') {
      setDetection((prev) => ({
        ...prev,
        studentNumberColumn: value || null,
      }));
    } else if (type === 'assessment' && assessmentId) {
      setDetection((prev) => ({
        ...prev,
        assessmentColumns: {
          ...prev.assessmentColumns,
          [assessmentId]: value,
        },
      }));
    }
  };
  const validateAndPreviewData = () => {
    if (!detection.studentNumberColumn) {
      notifications.show({
        title: 'Error',
        message: 'Please specify a student number column',
        color: 'red',
      });
      return;
    }

    const mappedAssessments = Object.entries(
      detection.assessmentColumns,
    ).filter(([_, column]) => column !== null && column !== '');

    if (mappedAssessments.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Please map at least one assessment column',
        color: 'red',
      });
      return;
    }

    const studentColumnIndex = letterToIndex(detection.studentNumberColumn);
    const rows: ImportRow[] = [];

    excelData.slice(1).forEach((row, index) => {
      const studentNumber = String(row[studentColumnIndex] || '').trim();

      if (!studentNumber) {
        return;
      }

      if (!isValidStudentNumber(studentNumber)) {
        return;
      }

      const marks: Record<string, number | undefined> = {};
      const errors: string[] = [];

      mappedAssessments.forEach(([assessmentId, columnLetter]) => {
        const columnIndex = letterToIndex(columnLetter);
        const markValue = row[columnIndex];
        const assessment = assessments.find(
          (a) => a.id === parseInt(assessmentId),
        );

        if (markValue !== undefined && markValue !== '') {
          const numericMark = Number(markValue);

          if (isNaN(numericMark)) {
            errors.push(
              `Invalid mark "${markValue}" for ${assessment?.assessmentType || 'assessment'}`,
            );
          } else if (assessment) {
            if (numericMark < 0 || numericMark > assessment.totalMarks) {
              errors.push(
                `Mark ${numericMark} for ${assessment.assessmentType} must be between 0 and ${assessment.totalMarks}`,
              );
            } else {
              marks[assessmentId] = numericMark;
            }
          }
        }
      });

      rows.push({
        rowNumber: index + 2,
        studentNumber,
        marks,
        status: errors.length > 0 ? 'error' : 'pending',
        errors,
      });
    });

    setImportData(rows);
    setStep('preview');
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const results = [];

      for (const row of importData) {
        if (row.status === 'error') {
          results.push({ ...row, status: 'error' as const });
          continue;
        }

        try {
          const stdNo = parseInt(row.studentNumber);

          for (const [assessmentIdStr, markValue] of Object.entries(
            row.marks,
          )) {
            if (markValue === undefined) continue;

            const assessmentId = parseInt(assessmentIdStr);

            const existingMark = existingMarks.find(
              (m) => m.assessmentId === assessmentId && m.stdNo === stdNo,
            );

            if (existingMark) {
              await updateAssessmentMark(existingMark.id, {
                assessmentId,
                stdNo,
                marks: markValue,
              });
            } else {
              await createAssessmentMark({
                assessmentId,
                stdNo,
                marks: markValue,
              });
            }
          }

          await calculateAndSaveModuleGrade(moduleId, stdNo);
          results.push({ ...row, status: 'success' as const, errors: [] });
        } catch (error) {
          results.push({
            ...row,
            status: 'error' as const,
            errors: [
              `Failed to save marks: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ],
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.status === 'success').length;
      const errorCount = results.filter((r) => r.status === 'error').length;

      setImportData(results);

      queryClient.invalidateQueries({
        queryKey: ['assessmentMarks', moduleId],
      });
      queryClient.invalidateQueries({
        queryKey: ['moduleGrades', moduleId],
      });

      notifications.show({
        title: 'Import Complete',
        message: `Successfully imported ${successCount} records. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`,
        color: successCount > 0 ? 'green' : 'orange',
      });
    },
    onError: (error) => {
      notifications.show({
        title: 'Import Failed',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        color: 'red',
      });
    },
  });

  const handleImport = () => {
    setIsProcessing(true);
    setStep('importing');
    importMutation.mutate();
  };
  const resetForm = () => {
    setFile(null);
    setExcelData([]);
    setImportData([]);
    setDetection({
      studentNumberColumn: null,
      assessmentColumns: {},
      detectedColumns: [],
    });
    setStep('upload');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  const renderUploadStep = () => (
    <Stack gap='md'>
      <Alert icon={<IconInfoCircle />} color='blue' variant='light'>
        <Text size='sm'>
          Upload an Excel file containing student numbers (format: 9010xxxxx)
          and assessment marks. The system will automatically detect columns and
          suggest mappings.
        </Text>
      </Alert>

      <FileInput
        label='Select Excel File'
        placeholder='Choose .xlsx or .xls file'
        accept='.xlsx,.xls'
        value={file}
        onChange={handleFileUpload}
        leftSection={<IconFileSpreadsheet size={16} />}
      />

      {file && (
        <Paper withBorder p='md' bg='gray.0'>
          <Group>
            <IconCheck color='green' size={20} />
            <div>
              <Text size='sm' fw={500}>
                {file.name}
              </Text>
              <Text size='xs' c='dimmed'>
                {detection.detectedColumns.length > 0
                  ? `${detection.detectedColumns.length} columns, ${excelData.length - 1} rows`
                  : 'Processing...'}
              </Text>
            </div>
          </Group>
        </Paper>
      )}
    </Stack>
  );
  const renderMappingStep = () => (
    <Stack gap='md'>
      <Alert icon={<IconWand />} color='blue' variant='light'>
        <Text size='sm'>
          Column detection complete! Review the automatic mappings below and
          adjust using Excel column letters (A, B, C, etc.) if needed.
        </Text>
      </Alert>

      <Card withBorder>
        <Text size='sm' fw={500} mb='sm'>
          Column Analysis
        </Text>
        <ScrollArea h={200}>
          {' '}
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Column</Table.Th>
                <Table.Th>Header</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Confidence</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {detection.detectedColumns.map((col) => (
                <Table.Tr key={col.letter}>
                  <Table.Td>
                    <Badge variant='light' size='sm'>
                      {col.letter}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{col.header || '(empty)'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        col.type === 'student'
                          ? 'blue'
                          : col.type === 'assessment'
                            ? 'green'
                            : 'gray'
                      }
                      variant='light'
                      size='xs'
                    >
                      {col.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        col.confidence === 'high'
                          ? 'green'
                          : col.confidence === 'medium'
                            ? 'yellow'
                            : 'gray'
                      }
                      variant='light'
                      size='xs'
                    >
                      {col.confidence}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Divider />

      <TextInput
        label='Student Number Column'
        placeholder='Enter column letter (e.g., A, B, C)'
        description='Column containing 9-digit student numbers starting with 9010'
        value={detection.studentNumberColumn || ''}
        onChange={(e) =>
          updateColumnMapping('student', e.target.value.toUpperCase())
        }
        required
      />

      <Text size='sm' fw={500} mt='md'>
        Assessment Columns
      </Text>
      <Stack gap='xs'>
        {assessments.map((assessment) => {
          const expectedLabel =
            ASSESSMENT_TYPES.find(
              (type) => type.value === assessment.assessmentType,
            )?.label || assessment.assessmentType;

          return (
            <Group key={assessment.id} justify='space-between'>
              <div style={{ flex: 1 }}>
                <Text size='sm' fw={500}>
                  {expectedLabel}
                </Text>
                <Text size='xs' c='dimmed'>
                  {assessment.assessmentNumber} • Max: {assessment.totalMarks}{' '}
                  marks • Weight: {assessment.weight}%
                </Text>
              </div>
              <TextInput
                placeholder='Column (e.g., B)'
                value={detection.assessmentColumns[assessment.id] || ''}
                onChange={(e) =>
                  updateColumnMapping(
                    'assessment',
                    e.target.value.toUpperCase(),
                    assessment.id,
                  )
                }
                style={{ width: 100 }}
              />
            </Group>
          );
        })}
      </Stack>
    </Stack>
  );
  const renderPreviewStep = () => (
    <Stack gap='md'>
      <Group justify='space-between'>
        <div>
          <Text size='lg' fw={500}>
            Import Preview
          </Text>
          <Text size='sm' c='dimmed'>
            {importData.length} valid rows •{' '}
            {importData.filter((r) => r.status === 'error').length} errors
          </Text>
        </div>
        <Badge
          color={
            importData.every((r) => r.status !== 'error') ? 'green' : 'orange'
          }
          variant='light'
        >
          {importData.every((r) => r.status !== 'error')
            ? 'Ready to Import'
            : 'Has Errors'}
        </Badge>
      </Group>

      <Alert icon={<IconInfoCircle />} color='blue' variant='light'>
        <Text size='sm'>
          Only rows with valid 9-digit student numbers starting with "9010" are
          shown below. Other rows have been automatically filtered out.
        </Text>
      </Alert>

      <ScrollArea h={400}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Row</Table.Th>
              <Table.Th>Student Number</Table.Th>
              {Object.entries(detection.assessmentColumns)
                .filter(([_, column]) => column !== null && column !== '')
                .map(([assessmentId, _]) => {
                  const assessment = assessments.find(
                    (a) => a.id === parseInt(assessmentId),
                  );
                  return (
                    <Table.Th key={assessmentId}>
                      {assessment?.assessmentType}
                    </Table.Th>
                  );
                })}
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {importData.map((row, index) => (
              <Table.Tr key={index}>
                <Table.Td>{row.rowNumber}</Table.Td>
                <Table.Td>{row.studentNumber}</Table.Td>
                {Object.entries(detection.assessmentColumns)
                  .filter(([_, column]) => column !== null && column !== '')
                  .map(([assessmentId, _]) => (
                    <Table.Td key={assessmentId}>
                      {row.marks[assessmentId] !== undefined
                        ? row.marks[assessmentId]
                        : '-'}
                    </Table.Td>
                  ))}
                <Table.Td>
                  <Group gap={4}>
                    {row.status === 'error' ? (
                      <Tooltip label={row.errors.join('; ')}>
                        <ActionIcon color='red' variant='light' size='sm'>
                          <IconX size={12} />
                        </ActionIcon>
                      </Tooltip>
                    ) : row.status === 'success' ? (
                      <ActionIcon color='green' variant='light' size='sm'>
                        <IconCheck size={12} />
                      </ActionIcon>
                    ) : (
                      <Badge size='xs' color='blue' variant='light'>
                        Pending
                      </Badge>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {importData.some((r) => r.status === 'error') && (
        <Alert icon={<IconAlertTriangle />} color='orange' variant='light'>
          <Text size='sm'>
            Some rows have errors and will be skipped during import. Fix the
            data in your Excel file and re-upload to include these rows.
          </Text>
        </Alert>
      )}
    </Stack>
  );
  const renderImportingStep = () => (
    <Stack gap='md' align='center'>
      <Text size='lg' fw={500}>
        Importing Marks...
      </Text>
      <Progress value={100} size='lg' style={{ width: '100%' }} animated />
      <Text size='sm' c='dimmed'>
        Please wait while we process your data. This may take a few moments.
      </Text>
    </Stack>
  );

  const getModalTitle = () => {
    switch (step) {
      case 'upload':
        return 'Import Marks from Excel';
      case 'mapping':
        return 'Review Column Detection';
      case 'preview':
        return 'Preview Import Data';
      case 'importing':
        return 'Importing Marks';
      default:
        return 'Import Marks';
    }
  };
  const getModalActions = () => {
    switch (step) {
      case 'upload':
        return (
          <Group>
            <Button variant='default' onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep('mapping')}
              disabled={!file || detection.detectedColumns.length === 0}
            >
              Next
            </Button>
          </Group>
        );
      case 'mapping':
        return (
          <Group>
            <Button variant='default' onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={validateAndPreviewData}>Preview Data</Button>
          </Group>
        );
      case 'preview':
        return (
          <Group>
            <Button variant='default' onClick={() => setStep('mapping')}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importData.length === 0 || isProcessing}
              loading={isProcessing}
            >
              Import Marks
            </Button>
          </Group>
        );
      case 'importing':
        return (
          <Button onClick={handleClose} disabled={importMutation.isPending}>
            {importMutation.isPending ? 'Importing...' : 'Close'}
          </Button>
        );
      default:
        return null;
    }
  };
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={getModalTitle()}
      size='xl'
      closeOnClickOutside={false}
      closeOnEscape={!isProcessing}
    >
      <Stack gap='lg'>
        {step === 'upload' && renderUploadStep()}
        {step === 'mapping' && renderMappingStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {getModalActions()}
      </Stack>
    </Modal>
  );
}
