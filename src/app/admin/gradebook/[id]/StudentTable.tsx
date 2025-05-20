'use client';
import { Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';

type Props = {
  semesterModuleIds: number[];
};

export default function StudentTable({ semesterModuleIds }: Props) {
  const [semesterModuleId] = useQueryState('semesterModuleId');

  const { data: students } = useQuery({
    queryKey: ['students', semesterModuleIds],
    queryFn: () => [],
  });

  return (
    <>
      <Text>Students</Text>
    </>
  );
}
