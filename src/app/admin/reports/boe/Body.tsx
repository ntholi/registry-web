'use client';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateBoeReportForFICT } from '@/server/reports/boe/actions';
import {
  Card,
  CardSection,
  Text,
  Title,
  Button,
  Group,
  Loader,
  Stack,
} from '@mantine/core';

export default function Body() {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsDownloading(true);
      try {
        const result = await generateBoeReportForFICT();
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate report');
        }
        return result.data;
      } finally {
        setIsDownloading(false);
      }
    },
    onSuccess: (base64Data) => {
      if (!base64Data) {
        throw new Error('No data received from server');
      }
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FICT_BOE_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      console.error('Error generating BOE report:', error);
      alert(`Error generating BOE report: ${error.message}`);
    },
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate();
  };

  return (
    <Stack align='center' justify='center' p='xl'>
      <Card shadow='md' radius='md' withBorder w='100%' maw={600}>
        <CardSection inheritPadding py='md'>
          <Title order={3}>BOE Report Generation</Title>
          <Text c='dimmed' size='sm'>
            Generate Board of Examination (BOE) reports for FICT programs
          </Text>
        </CardSection>
        <CardSection inheritPadding>
          <Text my='sm'>
            This will generate a BOE report for all students in the Faculty of
            Information and Communication Technology (FICT) for the current
            term.
          </Text>
        </CardSection>
        <CardSection inheritPadding py='md'>
          <Group>
            <Button
              fullWidth
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending || isDownloading}
              leftSection={
                generateReportMutation.isPending || isDownloading ? (
                  <Loader size={16} />
                ) : null
              }
            >
              {generateReportMutation.isPending || isDownloading
                ? 'Generating Report...'
                : 'Generate BOE Report for FICT'}
            </Button>
          </Group>
        </CardSection>
      </Card>
    </Stack>
  );
}
