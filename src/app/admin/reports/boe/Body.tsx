'use client';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateBoeReportForFICT } from '@/server/reports/boe/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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
    <div className='container mx-auto py-8'>
      <Card className='mx-auto w-full max-w-3xl'>
        <CardHeader>
          <CardTitle>BOE Report Generation</CardTitle>
          <CardDescription>
            Generate Board of Examination (BOE) reports for FICT programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='mb-4'>
            This will generate a BOE report for all students in the Faculty of
            Information and Communication Technology (FICT) for the current
            term.
          </p>
          <p className='mb-4'>
            The report will include student performance data for each module,
            including marks, grades, GPA, and CGPA.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGenerateReport}
            disabled={generateReportMutation.isPending || isDownloading}
            className='w-full'
          >
            {(generateReportMutation.isPending || isDownloading) && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            {generateReportMutation.isPending || isDownloading
              ? 'Generating Report...'
              : 'Generate BOE Report for FICT'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
