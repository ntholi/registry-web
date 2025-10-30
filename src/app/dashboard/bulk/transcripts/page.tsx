'use client';

import {
  getDistinctGraduationDates,
  getStudentsByGraduationDate,
} from '@/server/bulk/transcripts/actions';
import {
  Box,
  Button,
  Center,
  Loader,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { pdf, Document } from '@react-pdf/renderer';
import { IconDownload } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import TranscriptPDF from '../../students/[id]/graduation/transcript/TranscriptPDF';

function formatGraduationDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function parseMonthYear(formattedDate: string) {
  const parts = formattedDate.split(' ');
  if (parts.length !== 2) return null;
  const [month, year] = parts;
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  return { month: monthIndex, year: parseInt(year) };
}

export default function ExportTranscriptPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: graduationDates, isLoading: isDatesLoading } = useQuery({
    queryKey: ['distinctGraduationDates'],
    queryFn: getDistinctGraduationDates,
  });

  const groupedDates = graduationDates?.reduce(
    (acc, date) => {
      const formatted = formatGraduationDate(date);
      const parsed = parseMonthYear(formatted);
      if (!parsed) return acc;

      const key = `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = {
          label: formatted,
          dates: [],
        };
      }
      acc[key].dates.push(date);
      return acc;
    },
    {} as Record<string, { label: string; dates: string[] }>
  );

  const selectOptions =
    groupedDates &&
    Object.values(groupedDates).map((group) => ({
      value: group.dates.join(','),
      label: group.label,
    }));

  async function handleExport() {
    if (!selectedDate) return;

    setIsGenerating(true);
    try {
      const dates = selectedDate.split(',');
      const allStudents = [];

      for (const date of dates) {
        const students = await getStudentsByGraduationDate(date.trim());
        allStudents.push(...students);
      }

      if (allStudents.length === 0) {
        alert('No students found for the selected graduation date');
        return;
      }

      const pdfDoc = pdf(
        <Document>
          {allStudents.map((student, index) => (
            <TranscriptPDF key={index} student={student} />
          ))}
        </Document>
      );

      const blob = await pdfDoc.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcripts-${selectOptions?.find((opt) => opt.value === selectedDate)?.label.replace(/\s+/g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating transcripts:', error);
      alert('An error occurred while generating the transcripts');
    } finally {
      setIsGenerating(false);
    }
  }

  if (isDatesLoading) {
    return (
      <Center h={400}>
        <Loader size='lg' />
      </Center>
    );
  }

  return (
    <Box p='md'>
      <Stack gap='md'>
        <Text size='xl' fw={700}>
          Bulk Export Transcripts
        </Text>

        <Text size='sm' c='dimmed'>
          Select a graduation date to export all transcripts for students who
          graduated in that month and year.
        </Text>

        <Select
          label='Graduation Date'
          placeholder='Select a graduation date'
          data={selectOptions || []}
          value={selectedDate}
          onChange={setSelectedDate}
          searchable
          disabled={isGenerating}
        />

        <Button
          leftSection={<IconDownload size='1rem' />}
          onClick={handleExport}
          disabled={!selectedDate || isGenerating}
          loading={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Export Transcripts'}
        </Button>

        {isGenerating && (
          <Text size='sm' c='dimmed'>
            This may take a few moments depending on the number of students...
          </Text>
        )}
      </Stack>
    </Box>
  );
}
