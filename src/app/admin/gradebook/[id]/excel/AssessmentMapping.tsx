'use client';
import { useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { getAssessmentTypeLabel } from '../../../assessments/[id]/assessments';
import {
  AssessmentInfo,
  ColumnMapping,
  DetectedColumns,
  ExcelData,
} from './types';
import { columnIndexToLetter } from './utils';

type Props = {
  excelData: ExcelData;
  detectedColumns: DetectedColumns;
  assessments: AssessmentInfo[];
  onConfirm: (mapping: ColumnMapping) => void;
};

export default function AssessmentMapping({
  excelData,
  detectedColumns,
  assessments,
  onConfirm,
}: Props) {
  const [mapping, setMapping] = useState<ColumnMapping>({
    studentNumberColumn: detectedColumns.studentNumberColumn,
    assessmentColumns: detectedColumns.assessmentColumns,
  });
  const columnOptions = excelData.headers.map((header, index) => ({
    value: columnIndexToLetter(index),
    label: `Column ${columnIndexToLetter(index)}`,
  }));
  const handleStudentNumberColumnChange = (value: string | null) => {
    setMapping({
      ...mapping,
      studentNumberColumn: value,
    });
  };

  const handleAssessmentColumnChange = (
    assessmentId: number,
    value: string | null,
  ) => {
    const newAssessmentColumns = { ...mapping.assessmentColumns };
    if (value) {
      newAssessmentColumns[assessmentId] = value;
    } else {
      delete newAssessmentColumns[assessmentId];
    }

    setMapping({
      ...mapping,
      assessmentColumns: newAssessmentColumns,
    });
  };

  const isComplete =
    mapping.studentNumberColumn &&
    assessments.every((assessment) => mapping.assessmentColumns[assessment.id]);

  const handleConfirm = () => {
    if (isComplete) {
      onConfirm(mapping);
    }
  };

  return (
    <Stack gap='md'>
      <Group align='center' gap='sm'>
        <Title order={4}>Column Mapping</Title>
      </Group>
      <Stack gap='sm'>
        <Text size='sm' fw={500}>
          Student Number Column
        </Text>
        <Select
          placeholder='Select student number column'
          data={columnOptions}
          value={mapping.studentNumberColumn}
          onChange={handleStudentNumberColumnChange}
          searchable
          clearable
        />
      </Stack>
      <Stack gap='sm'>
        <Text size='sm' fw={500}>
          Assessment Columns
        </Text>
        <Text size='xs' c='dimmed'>
          Map each assessment to its corresponding column. Only marks from the
          first column will be imported if there are multiple columns for the
          same assessment type.
        </Text>

        {assessments.map((assessment) => (
          <Group key={assessment.id} align='center' gap='md'>
            <Text size='sm' style={{ minWidth: 200 }}>
              {getAssessmentTypeLabel(assessment.assessmentType)}
            </Text>
            <Select
              placeholder='Select column'
              data={columnOptions}
              value={mapping.assessmentColumns[assessment.id] || null}
              onChange={(value) =>
                handleAssessmentColumnChange(assessment.id, value)
              }
              searchable
              clearable
              style={{ flex: 1 }}
            />
            {mapping.assessmentColumns[assessment.id] && (
              <IconCheck size='1rem' color='green' />
            )}
          </Group>
        ))}
      </Stack>{' '}
      <Group justify='flex-end'>
        <Button
          onClick={handleConfirm}
          disabled={!isComplete}
          leftSection={<IconCheck size='1rem' />}
        >
          Confirm Mapping
        </Button>
      </Group>
      {isComplete && (
        <Alert
          icon={<IconCheck size='1rem' />}
          title='Mapping Complete'
          color='green'
        >
          All required columns have been mapped. You can proceed with the
          import.
        </Alert>
      )}
    </Stack>
  );
}
