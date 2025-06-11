'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useMemo } from 'react';
import { getAssessmentTypeLabel } from '../../../assessments/[id]/assessments';
import { AssessmentInfo, ColumnMapping, ExcelData, ParsedRow } from './types';
import {
  columnLetterToIndex,
  normalizeStudentNumber,
  parseNumericValue,
} from './utils';

type Props = {
  excelData: ExcelData;
  columnMapping: ColumnMapping;
  assessments: AssessmentInfo[];
  onPreviewGenerated: (rows: ParsedRow[]) => void;
  onBack: () => void;
};

export default function ImportPreview({
  excelData,
  columnMapping,
  assessments,
  onPreviewGenerated,
  onBack,
}: Props) {
  const parsedData = useMemo(
    () => parseExcelData(excelData, assessments, columnMapping),
    [excelData, assessments, columnMapping],
  );

  const validRows = useMemo(
    () => parsedData.filter((row) => row.isValid),
    [parsedData],
  );

  const invalidRows = useMemo(
    () => parsedData.filter((row) => !row.isValid),
    [parsedData],
  );
  useEffect(() => {
    onPreviewGenerated(validRows);
  }, [validRows]);

  return (
    <Stack gap='md'>
      <Group align='center' justify='space-between'>
        <Title order={4}>Import Preview</Title>
        <Group gap='sm'>
          <Badge color='green' variant='light'>
            {validRows.length} Valid
          </Badge>
          <Badge color='red' variant='light'>
            {invalidRows.length} Invalid
          </Badge>
        </Group>
      </Group>
      {validRows.length > 0 && (
        <Paper p='md' withBorder>
          <Stack gap='sm'>
            <ScrollArea h={300}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>Student Number</Table.Th>
                    {assessments.map((assessment) => (
                      <Table.Th key={assessment.id}>
                        {shorten(
                          getAssessmentTypeLabel(assessment.assessmentType),
                        )}
                        <Text size='xs' c='dimmed'>
                          {assessment.totalMarks} · {assessment.weight}%
                        </Text>
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {validRows.map((row) => (
                    <Table.Tr key={row.rowIndex}>
                      <Table.Td>{row.rowIndex + 2}</Table.Td>
                      <Table.Td>{row.studentNumber}</Table.Td>
                      {assessments.map((assessment) => (
                        <Table.Td key={assessment.id}>
                          {row.assessmentMarks[assessment.id] !== undefined
                            ? row.assessmentMarks[assessment.id]
                            : '-'}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Paper>
      )}
      {invalidRows.length > 0 && (
        <Paper p='md' withBorder>
          <Stack gap='sm'>
            <Text size='sm' fw={500} c='red'>
              Invalid Records ({invalidRows.length})
            </Text>
            <ScrollArea h={200}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Row</Table.Th>
                    <Table.Th>Student Number</Table.Th>
                    <Table.Th>Errors</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {invalidRows.map((row) => (
                    <Table.Tr key={row.rowIndex}>
                      <Table.Td>{row.rowIndex + 2}</Table.Td>
                      <Table.Td>{row.studentNumber || '-'}</Table.Td>
                      <Table.Td>
                        <Text size='xs' c='red'>
                          {row.errors.join(', ')}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function parseExcelData(
  excelData: ExcelData,
  assessments: AssessmentInfo[],
  mapping: ColumnMapping,
): ParsedRow[] {
  const studentNumberColIndex = mapping.studentNumberColumn
    ? columnLetterToIndex(mapping.studentNumberColumn)
    : -1;

  const assessmentColIndices: Record<number, number> = {};
  for (const [assessmentId, column] of Object.entries(
    mapping.assessmentColumns,
  )) {
    assessmentColIndices[parseInt(assessmentId)] = columnLetterToIndex(column);
  }

  return excelData.rows
    .map((row, index) => {
      const errors: string[] = [];
      let studentNumber = '';
      const assessmentMarks: Record<number, number> = {};

      if (studentNumberColIndex >= 0) {
        const normalizedStudentNumber = normalizeStudentNumber(
          row[studentNumberColIndex],
        );
        if (normalizedStudentNumber) {
          studentNumber = normalizedStudentNumber;
        }
      } else {
        errors.push('Student number column not mapped');
      }

      for (const assessment of assessments) {
        const colIndex = assessmentColIndices[assessment.id];
        if (colIndex >= 0 && colIndex < row.length) {
          const mark = parseNumericValue(row[colIndex]);
          if (mark !== null) {
            if (mark >= 0 && mark <= assessment.totalMarks) {
              assessmentMarks[assessment.id] = mark;
            } else {
              errors.push(
                `Marks for ${getAssessmentTypeLabel(assessment.assessmentType)} is out of range. Expected value between 0 and ${assessment.totalMarks}, but received ${mark}`,
              );
            }
          }
        }
      }
      return {
        rowIndex: index,
        studentNumber,
        assessmentMarks,
        isValid: errors.length === 0 && studentNumber !== '',
        errors,
      };
    })
    .filter((row) => row.studentNumber !== '');
}

function shorten(name: string) {
  const names = name.split(' ');
  return names.map((n) => n.slice(0, 3)).join(' ');
}
