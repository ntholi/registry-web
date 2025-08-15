'use client';

import { formatSemester } from '@/lib/utils';
import { getStructureModules } from '@/server/structures/actions';
import {
  Autocomplete,
  AutocompleteProps,
  Badge,
  ComboboxItem,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useState } from 'react';

type Module = Awaited<ReturnType<typeof getStructureModules>>[number];

interface ModuleOption extends ComboboxItem {
  value: string;
  label: string;
  code: string;
  name: string;
  type: string;
  credits: number;
  semesterNumber: number;
}

export type ModuleSearchInputProps = Omit<
  AutocompleteProps,
  'data' | 'onChange' | 'value'
> & {
  value?: number | null;
  onChange?: (value: number | null) => void;
  structureId: number;
  onModuleSelect?: (module: Module | null) => void;
};

export const ModuleSearchInput = forwardRef<
  HTMLInputElement,
  ModuleSearchInputProps
>(({ onChange, value, structureId, onModuleSelect, ...props }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(inputValue, 300);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['structure-modules', structureId],
    queryFn: () => getStructureModules(structureId),
    enabled: !!structureId,
  });

  const filteredModules =
    modules?.filter(
      (module) =>
        debouncedSearch.length === 0 ||
        module.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        module.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) || [];

  const options: ModuleOption[] = filteredModules.map((module) => ({
    value: module.semesterModuleId.toString(),
    label: `${module.code} - ${module.name}`,
    code: module.code || '',
    name: module.name || '',
    type: module.type,
    credits: module.credits,
    semesterNumber: module.semesterNumber,
  }));

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleOptionSubmit = (value: string) => {
    const selectedModule = modules?.find(
      (module) => module.semesterModuleId.toString() === value
    );

    if (selectedModule) {
      onChange?.(selectedModule.semesterModuleId);
      if (onModuleSelect) onModuleSelect(selectedModule);
      setInputValue('');
    } else {
      onChange?.(null);
      if (onModuleSelect) onModuleSelect(null);
      setInputValue('');
    }
  };

  const displayValue = () => {
    return inputValue;
  };

  return (
    <Autocomplete
      ref={ref}
      value={displayValue()}
      onChange={handleInputChange}
      onOptionSubmit={handleOptionSubmit}
      data={options}
      placeholder='Search for modules by code or name'
      limit={10}
      clearable
      maxDropdownHeight={400}
      rightSection={isLoading ? <Loader size='xs' /> : null}
      renderOption={({ option }) => {
        const moduleOption = option as ModuleOption;
        return (
          <Stack gap={0}>
            <Group gap={'xs'}>
              <Text size='sm' fw={500}>
                {moduleOption.code}
              </Text>
              <Text size='sm'>{moduleOption.name}</Text>
            </Group>

            <Text size='xs' c='dimmed'>
              {formatSemester(moduleOption.semesterNumber)}
            </Text>
          </Stack>
        );
      }}
      {...props}
    />
  );
});

ModuleSearchInput.displayName = 'ModuleSearchInput';
