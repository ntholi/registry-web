'use client';

import { useState } from 'react';
import { Button } from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import { getGraduationClearanceData, getGraduationRequestByStudentNo } from '@/server/graduation/requests/actions';
import ProofOfClearancePDF from '@/app/student/graduation/components/ProofOfClearancePDF';

type ProofOfClearancePrinterProps = {
  stdNo: string;
};

export default function ProofOfClearancePrinter({ stdNo }: ProofOfClearancePrinterProps) {
  const [isReady, setIsReady] = useState(false);

  const { data: graduationRequest } = useQuery({
    queryKey: ['graduationRequest', stdNo],
    queryFn: () => getGraduationRequestByStudentNo(Number(stdNo)),
    enabled: isReady,
  });

  const { data: graduationData, isLoading } = useQuery({
    queryKey: ['graduationClearanceData', graduationRequest?.id],
    queryFn: () => getGraduationClearanceData(graduationRequest!.id),
    enabled: isReady && !!graduationRequest?.id,
  });

  function handlePrintClick() {
    setIsReady(true);
  }

  if (!isReady) {
    return (
      <Button
        leftSection={<IconPrinter size="1rem" />}
        onClick={handlePrintClick}
        loading={isLoading}
        variant="filled"
      >
        Print Clearance
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button
        leftSection={<IconPrinter size="1rem" />}
        loading
        variant="filled"
      >
        Loading...
      </Button>
    );
  }

  if (!graduationData) {
    return (
      <Button
        leftSection={<IconPrinter size="1rem" />}
        disabled
        variant="filled"
      >
        No Data Available
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ProofOfClearancePDF graduationData={graduationData} />}
      fileName={`proof_of_clearance_${stdNo}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <Button
          leftSection={<IconPrinter size="1rem" />}
          loading={loading}
          variant="filled"
        >
          Print Clearance
        </Button>
      )}
    </PDFDownloadLink>
  );
}