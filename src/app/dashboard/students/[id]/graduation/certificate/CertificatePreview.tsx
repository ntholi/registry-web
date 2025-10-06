'use client';

import { getAcademicHistory } from '@/server/students/actions';
import {
  Box,
  Center,
  Loader,
  Text,
  Stack,
  Select,
  Paper,
  Image,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type CertificatePreviewProps = {
  stdNo: number;
  isActive: boolean;
};

type Student = NonNullable<Awaited<ReturnType<typeof getAcademicHistory>>>;
type StudentProgram = Student['programs'][number];

export default function CertificatePreview({
  stdNo,
  isActive,
}: CertificatePreviewProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', stdNo, 'no-current-term'],
    queryFn: () => getAcademicHistory(stdNo, true),
    enabled: isActive,
  });

  if (isLoading) {
    return (
      <Center h={600}>
        <Loader size='lg' />
      </Center>
    );
  }

  if (!student) {
    return (
      <Center h={600}>
        <Text c='dimmed'>No student data available</Text>
      </Center>
    );
  }

  const completedPrograms = (student.programs || []).filter(
    (p): p is StudentProgram => p !== null && p.status === 'Completed'
  );

  if (completedPrograms.length === 0) {
    return (
      <Center h={600}>
        <Text c='dimmed'>No completed programs found</Text>
      </Center>
    );
  }

  const programOptions = completedPrograms.map((program) => ({
    value: String(program.id),
    label: program.structure?.program?.name || 'Unknown Program',
  }));

  const currentProgramId = selectedProgramId || String(completedPrograms[0].id);
  const currentProgram = completedPrograms.find(
    (p) => String(p.id) === currentProgramId
  );

  return (
    <Stack gap='md'>
      {completedPrograms.length > 1 && (
        <Select
          label='Select Program'
          placeholder='Choose a program'
          data={programOptions}
          value={currentProgramId}
          onChange={setSelectedProgramId}
          style={{ maxWidth: 400 }}
        />
      )}

      {currentProgram && (
        <Certificate student={student} program={currentProgram} />
      )}
    </Stack>
  );
}

function Certificate({
  student,
  program,
}: {
  student: Student;
  program: StudentProgram;
}) {
  const graduationDate = program.graduationDate
    ? new Date(program.graduationDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const programName = program.structure?.program?.name || 'Unknown Program';

  return (
    <Paper
      shadow='sm'
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        aspectRatio: '1000/1414',
        overflow: 'hidden',
      }}
    >
      <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Image
          src='/images/certificate.webp'
          alt='Certificate'
          style={{ objectFit: 'contain' }}
        />

        <Text
          style={{
            position: 'absolute',
            top: '33%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(18px, 3.2vw, 42px)',
            fontWeight: 400,
            fontFamily: 'Georgia, serif',
            color: '#000',
            textAlign: 'center',
            width: '80%',
            letterSpacing: '0.02em',
          }}
        >
          {student.name}
        </Text>

        <Box
          style={{
            position: 'absolute',
            top: '42.5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 'clamp(16px, 2.8vw, 36px)',
              fontWeight: 400,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              color: '#000',
              lineHeight: 1.3,
              letterSpacing: '0.01em',
            }}
          >
            {programName}
          </Text>
        </Box>

        <Text
          style={{
            position: 'absolute',
            top: '70%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(10px, 1.6vw, 20px)',
            fontWeight: 400,
            fontFamily: 'Georgia, serif',
            color: '#000',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}
        >
          {graduationDate}
        </Text>
      </Box>
    </Paper>
  );
}
