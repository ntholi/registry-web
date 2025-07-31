'use client';

import AcademicsView from '@/app/dashboard/students/[id]/AcademicsView';
import { getStudent } from '@/server/students/actions';
import { Box, Center, Loader } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

type Props = {
  stdNo: number;
};

export default function AcademicsLoader({ stdNo }: Props) {
  const { data: student, isLoading } = useQuery({
    queryFn: () => getStudent(stdNo),
    queryKey: ['students', stdNo],
  });

  if (isLoading) {
    return (
      <Center mt={'4rem'}>
        <Loader size='sm' />
      </Center>
    );
  }

  if (!student) return null;

  return (
    <Box p={'lg'}>
      <AcademicsView stdNo={student.stdNo} isActive />
    </Box>
  );
}
