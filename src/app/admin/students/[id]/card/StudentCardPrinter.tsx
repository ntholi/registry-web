'use client';

import { createStudentCardPrint } from '@/server/student-card-prints/actions';
import { getStudent } from '@/server/students/actions';
import { Button } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import { IconPrinter } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import StudentCardPDF from './StudentCardPDF';

type StudentCardPrinterProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  photoUrl: string | null;
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
    try {
      if (!session?.user?.id) {
        console.error('No authenticated user found');
        return null;
      }

      const record = await createStudentCardPrint({
        stdNo: student.stdNo,
        printedBy: session.user.id,
        reference: `${student.name} - ${new Date().toISOString()}`,
      });

      console.log('Student card print record created successfully');
      return record;
    } catch (error) {
      console.error('Failed to create student card print record:', error);
      return null;
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      if (!student) {
        console.error('No student data available');
        setIsGenerating(false);
        return;
      }

      if (!photoUrl) {
        console.error('No photo selected');
        setIsGenerating(false);
        return;
      }

      console.log('Generating Student Card PDF for student:', student.stdNo);

      const printRecord = await createPrintRecord();
      if (!printRecord) {
        console.error('Failed to create print record');
        setIsGenerating(false);
        return;
      }

      const blob = await pdf(
        <StudentCardPDF student={student} photoUrl={photoUrl} />,
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
      console.error('Error generating Student Card PDF for printing:', error);
      setIsGenerating(false);
    }
  };

  return (
    <Button
      leftSection={<IconPrinter size='1rem' />}
      onClick={handlePrint}
      disabled={isGenerating || disabled}
    >
      Print Student Card
    </Button>
  );
}
