'use client';

import {
  Badge,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconChevronRight,
  IconFileSpreadsheet,
  IconTable,
} from '@tabler/icons-react';

interface Props {
  sheetNames: string[];
  selectedSheet: string | null;
  onSheetSelect: (sheetName: string) => void;
}

export default function SheetSelector({ sheetNames, onSheetSelect }: Props) {
  if (sheetNames.length <= 1) {
    return null;
  }
  return (
    <Card withBorder shadow='sm' radius='md' p='lg'>
      <Stack gap='md'>
        {' '}
        <Group gap='sm' align='center'>
          <ThemeIcon size='lg' color='blue' variant='light'>
            <IconFileSpreadsheet size={20} />
          </ThemeIcon>
          <div>
            <Title order={4} mb={2}>
              Multiple Sheets Detected
            </Title>
            <Text size='sm' c='dimmed'>
              Select the sheet containing assessment data
            </Text>
          </div>
          <Badge variant='light' color='blue' ml='auto'>
            {sheetNames.length} sheets
          </Badge>
        </Group>
        <Stack gap='xs'>
          {sheetNames.map((sheetName) => (
            <Paper
              key={sheetName}
              withBorder
              p='md'
              radius='sm'
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onSheetSelect(sheetName)}
            >
              <Group justify='space-between' align='center'>
                <Group gap='sm' align='center'>
                  <IconTable size={18} />
                  <Text>{sheetName}</Text>
                </Group>
                <IconChevronRight size={16} />
              </Group>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
