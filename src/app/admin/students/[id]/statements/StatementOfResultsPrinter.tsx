'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import StatementOfResultsPDF from './StatementOfResultsPDF';
import { getStudent } from '@/server/students/actions';

type StatementOfResultsPrinterProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
};

export default function StatementOfResultsPrinter({
  student,
}: StatementOfResultsPrinterProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(
        <StatementOfResultsPDF student={student} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          const handleAfterPrint = () => {
            URL.revokeObjectURL(url);
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            setIsGenerating(false);
            if (iframe.contentWindow) {
              iframe.contentWindow.removeEventListener(
                'afterprint',
                handleAfterPrint,
              );
            }
          };

          iframe.contentWindow.addEventListener('afterprint', handleAfterPrint);
        } else {
          console.error('Failed to access iframe content window.');
          URL.revokeObjectURL(url);
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          setIsGenerating(false);
        }
      };

      iframe.onerror = () => {
        console.error('Failed to load PDF in iframe.');
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        setIsGenerating(false);
      };
    } catch (error) {
      console.error('Error generating PDF for printing:', error);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      leftSection={<IconPrinter size='1rem' />}
      variant='filled'
      color='blue'
      loading={isGenerating}
      onClick={handlePrint}
    >
      {isGenerating ? 'Preparing Statement...' : 'Print Statement of Results'}
    </Button>
  );
}
