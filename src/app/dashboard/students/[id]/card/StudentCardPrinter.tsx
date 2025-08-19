'use client';

import { createStudentCardPrint } from '@/server/student-card-prints/actions';
import { getStudent } from '@/server/students/actions';
import { convertUrlToBase64 } from '@/lib/utils';
import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import StudentCardPDF from './StudentCardPDF';

type StudentCardPrinterProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  photoUrl: string | null | undefined;
  disabled?: boolean;
};

export default function StudentCardPrinter({
  student,
  photoUrl,
  disabled,
}: StudentCardPrinterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: session } = useSession();

  const createPrintRecord = async () => {
    if (!session?.user?.id) {
      throw new Error('No authenticated user found');
    }

    return await createStudentCardPrint({
      stdNo: student.stdNo,
      printedBy: session.user.id,
      reference: `${student.name} - ${new Date().toISOString()}`,
    });
  };

  const processPhotoUrl = async (url: string): Promise<string> => {
    if (url.startsWith('http')) {
      try {
        return await convertUrlToBase64(url);
      } catch (error) {
        console.error('Failed to convert photo URL to base64:', error);
        return url;
      }
    }
    return url;
  };

  const handlePrint = async () => {
    if (!student || !photoUrl) {
      console.error('Missing student data or photo');
      return;
    }

    setIsGenerating(true);

    try {
      await createPrintRecord();

      const processedPhotoUrl = await processPhotoUrl(photoUrl);

      const blob = await pdf(
        <StudentCardPDF student={student} photoUrl={processedPhotoUrl} />
      ).toBlob();

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');

      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        setIsGenerating(false);
      };

      iframe.onload = () => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          iframe.contentWindow.addEventListener('afterprint', cleanup);
        } else {
          cleanup();
        }
      };

      iframe.onerror = cleanup;
    } catch (error) {
      console.error('Error generating Student Card PDF:', error);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      leftSection={<IconPrinter size='1rem' />}
      onClick={handlePrint}
      variant='default'
      mt={'md'}
      disabled={isGenerating || disabled}
      fullWidth
    >
      Print Student Card
    </Button>
  );
}
