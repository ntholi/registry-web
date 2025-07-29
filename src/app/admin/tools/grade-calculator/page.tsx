'use client';

import {
  Box,
  Container,
  Group,
  Paper,
  Stack,
  ThemeIcon,
  Text,
  Title,
} from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import { GradeCalculatorForm } from './components/GradeCalculatorForm';
import { GradeTable } from './components/GradeTable';

export default function GradeCalculatorPage() {
  return (
    <Container size='xl' py='lg' px='xl'>
      <Stack gap='xl'>
        <Paper withBorder radius='md' p='lg'>
          <Stack gap='md'>
            <Group gap='xs' align='center'>
              <ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
                <IconCalculator size={24} />
              </ThemeIcon>
              <Box>
                <Title fw={400} size='h4'>
                  Grade Calculator
                </Title>
                <Text size='sm' c='dimmed'>
                  A tool for calculating student grades and GPA based on course
                  credits and marks.
                </Text>
              </Box>
            </Group>
            <GradeCalculatorForm />
          </Stack>
        </Paper>
        <GradeTable />
      </Stack>
    </Container>
  );
}
