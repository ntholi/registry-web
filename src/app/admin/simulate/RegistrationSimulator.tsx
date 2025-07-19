'use client';

import { getStudentSemesterModules } from '@/server/registration-requests/actions';
import { getStudent, getStudentByUserId } from '@/server/students/actions';
import { getAcademicRemarks } from '@/utils/grades';
import {
  Box,
  Button,
  NumberInput,
  Stack,
  Code,
  TextInput,
  Paper,
  Group,
} from '@mantine/core';
import { useState, useTransition } from 'react';

type Modules = Awaited<ReturnType<typeof getStudentSemesterModules>>;

export default function ModuleSimulator() {
  const [stdNo, setStdNo] = useState<string>('');
  const [modules, setModules] = useState<Modules | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit() {
    startTransition(async () => {
      const lookup = await getStudent(Number(stdNo));
      if (!lookup) {
        return;
      }
      const student = await getStudentByUserId(lookup.userId);
      if (!student) {
        return;
      }
      const remarks = getAcademicRemarks(student.programs);
      const moduleData = await getStudentSemesterModules(student, remarks);
      setModules(moduleData);
    });
  }

  return (
    <Stack>
      <Group>
        <TextInput
          placeholder='Student Number'
          value={stdNo}
          onChange={(e) => setStdNo(e.target.value)}
        />
        <Button onClick={handleSubmit} loading={isPending}>
          Simulate
        </Button>
      </Group>
      <Paper withBorder p='md'>
        <Code block>{JSON.stringify(modules, null, 2)}</Code>
      </Paper>
    </Stack>
  );
}
