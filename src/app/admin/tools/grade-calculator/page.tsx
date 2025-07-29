'use client';

import { Container, Paper, Stack, Title } from '@mantine/core';
import { GradeCalculatorForm } from './components/GradeCalculatorForm';
import { GradeTable } from './components/GradeTable';

export default function GradeCalculatorPage() {
  return (
    <Container size='xl'>
      <Title order={1} mb='lg'>
        Grade Calculator
      </Title>
      <Stack gap='lg'>
        <Paper withBorder p='lg'>
          <GradeCalculatorForm />
        </Paper>
        <GradeTable />
      </Stack>
    </Container>
  );
}
