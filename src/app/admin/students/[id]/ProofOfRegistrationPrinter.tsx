'use client';

import { getStudentRegistrationData } from '@/server/students/actions';
import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ProofOfRegistrationPDF from './ProofOfRegistrationPDF';

type Props = {
  disabled?: boolean;
  stdNo: number;
};

export default function ProofOfRegistrationPrinter({ stdNo, disabled }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: student } = useQuery({
    queryKey: ['studentRegistrationData', stdNo],
    queryFn: () => getStudentRegistrationData(stdNo),
  });

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      if (!student || !student.programs || student.programs.length === 0) {
        console.error('Invalid student data for PDF generation');
        setIsGenerating(false);
        return;
      }

      console.log(
        'Generating Proof of Registration PDF for student:',
        student.stdNo,
      );

      const blob = await pdf(
        <ProofOfRegistrationPDF student={student} />,
      ).toBlob();

      console.log('PDF blob generated, size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

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
      console.error('Student data:', student);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      leftSection={<IconPrinter size='1rem' />}
      variant='subtle'
      color='gray'
      size='xs'
      disabled={isGenerating || disabled}
      onClick={handlePrint}
    >
      Proof of Registration
    </Button>
  );
}
