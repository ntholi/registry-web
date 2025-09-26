'use client';

import { useState } from 'react';
import { Button, Loader } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { pdf } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import {
  getGraduationClearanceData,
  getGraduationRequestByStudentNo,
} from '@/server/graduation/requests/actions';
import ProofOfClearancePDF from '@/app/student/graduation/components/ProofOfClearancePDF';

type ProofOfClearancePrinterProps = {
  stdNo: string;
};

export default function ProofOfClearancePrinter({
  stdNo,
}: ProofOfClearancePrinterProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { refetch: fetchGraduationRequest, isLoading: isLoadingRequest } =
    useQuery({
      queryKey: ['graduationRequest', stdNo],
      queryFn: () => getGraduationRequestByStudentNo(Number(stdNo)),
      enabled: false,
    });

  const { refetch: fetchGraduationData, isLoading: isLoadingData } = useQuery({
    queryKey: ['graduationClearanceData'],
    queryFn: async () => {
      const requestResult = await fetchGraduationRequest();
      const request = requestResult.data;
      if (!request) throw new Error('No graduation request found');
      return getGraduationClearanceData(request.id);
    },
    enabled: false,
  });

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const result = await fetchGraduationData();
      const graduationData = result.data;

      if (!graduationData) {
        console.error('Invalid graduation data for PDF generation');
        setIsGenerating(false);
        return;
      }

      console.log(
        'Generating Proof of Clearance PDF for student:',
        graduationData.studentProgram.student.stdNo
      );

      const blob = await pdf(
        <ProofOfClearancePDF graduationData={graduationData} />
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
                handleAfterPrint
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

  const isLoading = isLoadingRequest || isLoadingData;

  return (
    <Button
      leftSection={
        isLoading ? <Loader size={'xs'} /> : <IconPrinter size='1rem' />
      }
      variant='subtle'
      color='gray'
      size='xs'
      w={165}
      disabled={isGenerating}
      onClick={handlePrint}
    >
      {isLoading ? 'Generating...' : 'Proof of Clearance'}
    </Button>
  );
}
