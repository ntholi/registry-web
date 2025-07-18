'use client';

import { CloseButton, TextInput, TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useQueryState } from 'nuqs';

export function SearchField(props: TextInputProps) {
  const [value, setValue] = useQueryState('q');
  const [, setPage] = useQueryState('page');

  const leftSection = value ? (
    <CloseButton
      onClick={() => {
        setValue(null);
        setPage('1');
      }}
    />
  ) : (
    <IconSearch size={20} />
  );
  return (
    <TextInput
      placeholder='Search'
      value={value || ''}
      onChange={(event) => {
        setValue(event.target.value);
        setPage('1');
      }}
      rightSection={leftSection}
      spellCheck={false}
      {...props}
    />
  );
}
