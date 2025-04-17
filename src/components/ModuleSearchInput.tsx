'use client';

import { searchModulesWithDetails } from '@/server/semester-modules/actions';
import {
  Autocomplete,
  AutocompleteProps,
  ComboboxItem,
  Group,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useState } from 'react';

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

interface ModuleOption extends ComboboxItem {
  value: string;
  label: string;
  code: string;
  studentCount: number;
}

export type ModuleSearchInputProps = Omit<
  AutocompleteProps,
  'data' | 'onChange' | 'value' | 'onOptionSubmit'
> & {
  onChange: (moduleId: number | null) => void;
  value?: number | null;
  onModuleSelect?: (module: Module | null) => void;
};

export const ModuleSearchInput = forwardRef<
  HTMLInputElement,
  ModuleSearchInputProps
>(({ onChange, value, onModuleSelect, ...props }, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(inputValue, 300);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['modules', 'search', debouncedSearch],
    queryFn: () => searchModulesWithDetails(debouncedSearch),
    enabled: debouncedSearch.length > 1,
  });

  const options: ModuleOption[] =
    modules?.map((module) => ({
      value: module.id.toString(),
      label: module.name,
      code: module.code,
      studentCount: module.studentCount ?? 0,
    })) || [];

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleOptionSubmit = (value: string) => {
    const selectedModule = modules?.find(
      (module) => module.id.toString() === value,
    );

    if (selectedModule) {
      onChange(selectedModule.id);
      if (onModuleSelect) onModuleSelect(selectedModule);
      setInputValue(`${selectedModule.code} - ${selectedModule.name}`);
    } else {
      onChange(null);
      if (onModuleSelect) onModuleSelect(null);
    }
  };

  const displayValue = () => {
    if (value && modules) {
      const selectedModule = modules.find((module) => module.id === value);
      if (selectedModule) {
        return `${selectedModule.code} - ${selectedModule.name}`;
      }
    }
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
      description={
        value && modules
          ? (() => {
              const mod = modules.find((m) => m.id === value);
              if (mod) {
                return `${mod.studentCount} student${mod.studentCount === 1 ? '' : 's'} registered this semester`;
              }
              return undefined;
            })()
          : undefined
      }
      renderOption={({ option }) => {
        const moduleOption = option as ModuleOption;
        return (
          <Stack gap={0}>
            <Group gap={'xs'}>
              <Text size='sm' fw={500}>
                {moduleOption.code}
              </Text>
              <Text size='sm'>{moduleOption.label}</Text>
            </Group>
            <Text size='xs' c='dimmed'>
              {moduleOption.studentCount} student
              {moduleOption.studentCount === 1 ? '' : 's'} registered
            </Text>
          </Stack>
        );
      }}
      {...props}
    />
  );
});

ModuleSearchInput.displayName = 'ModuleSearchInput';
