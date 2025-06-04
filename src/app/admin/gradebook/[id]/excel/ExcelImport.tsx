'use client';
import { Button } from '@mantine/core';
import { IconFileImport } from '@tabler/icons-react';

export default function ExcelImport() {
  return (
    <Button leftSection={<IconFileImport size={'1rem'} />} variant='light'>
      Import from Excel
    </Button>
  );
}
