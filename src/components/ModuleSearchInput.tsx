'use client';

import { searchModulesWithDetails } from '@/server/modules/actions';
import {
  Autocomplete,
  AutocompleteProps,
  Group,
  Loader,
  Text,
  Badge,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useState } from 'react';

type Module = Awaited<ReturnType<typeof searchModulesWithDetails>>[number];

type ModuleOption = {
  value: string;
  label: string;
  code: string;
  semesterName: string;
  programName: string;
};

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

  // Transform modules into options for the Autocomplete
  const options: ModuleOption[] =
    modules?.map((module) => ({
      value: module.id.toString(),
      label: module.name,
      code: module.code,
      semesterName: module.semester?.name || 'Unknown Semester',
      programName:
        module.semester?.structure?.program?.name || 'Unknown Program',
    })) || [];

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // Handle option selection
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

  // For display purposes, show the selected module code and name
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
      maxDropdownHeight={400}
      rightSection={isLoading ? <Loader size='xs' /> : null}
      filter={(value, item) =>
        item.label.toLowerCase().includes(value.toLowerCase()) ||
        item.code.toLowerCase().includes(value.toLowerCase())
      }
      nothingFound='No modules found'
      renderOption={(option) => (
        <Group wrap='nowrap'>
          <div style={{ flex: 1 }}>
            <Group justify='space-between'>
              <Text fw={500} size='sm'>
                {option.label}
              </Text>
              <Badge size='sm'>{option.code}</Badge>
            </Group>
            <Group>
              <Text size='xs' c='dimmed'>
                {option.semesterName}
              </Text>
              <Text size='xs' c='dimmed'>
                • {option.programName}
              </Text>
            </Group>
          </div>
        </Group>
      )}
      {...props}
    />
  );
});

ModuleSearchInput.displayName = 'ModuleSearchInput';
