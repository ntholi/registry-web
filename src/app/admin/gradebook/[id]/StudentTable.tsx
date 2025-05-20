'use client';
import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';

type Props = {
  moduleId: number;
};

export default function StudentTable({ moduleId }: Props) {
  const [semesterModuleId] = useQueryState('semesterModuleId');

  const { data: students } = useQuery({
    queryKey: ['students', moduleId],
    queryFn: () => [],
  });

  return (
    <>
      <Text>Students</Text>
    </>
  );
}
