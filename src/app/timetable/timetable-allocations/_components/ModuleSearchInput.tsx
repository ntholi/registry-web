'use client';

import { searchModulesWithDetails } from '@academic/semester-modules';
import {
	Autocomplete,
	type AutocompleteProps,
	type ComboboxItem,
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
	name: string;
}

export type ModuleSearchInputProps = Omit<
	AutocompleteProps,
	'data' | 'onChange' | 'value' | 'onOptionSubmit'
> & {
	onChange?: (moduleId: number | null) => void;
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
			value: module.moduleId.toString(),
			label: `${module.code} - ${module.name}`,
			code: module.code,
			name: module.name,
		})) || [];

	const handleInputChange = (value: string) => {
		setInputValue(value);
	};

	const handleOptionSubmit = (value: string) => {
		const selectedModule = modules?.find(
			(module) => module.moduleId.toString() === value
		);

		if (selectedModule) {
			onChange?.(selectedModule.moduleId);
			if (onModuleSelect) onModuleSelect(selectedModule);
			setInputValue(`${selectedModule.code} - ${selectedModule.name}`);
		} else {
			onChange?.(null);
			if (onModuleSelect) onModuleSelect(null);
		}
	};

	const displayValue = () => {
		if (value && modules) {
			const selectedModule = modules.find(
				(module) => module.moduleId === Number(value)
			);
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
			renderOption={({ option }) => {
				const moduleOption = option as ModuleOption;
				return (
					<Stack gap={0}>
						<Group gap={5}>
							<Text size='sm' fw={500}>
								{moduleOption.code}
							</Text>{' '}
							-<Text size='sm'>{moduleOption.name}</Text>
						</Group>
					</Stack>
				);
			}}
			{...props}
		/>
	);
});

ModuleSearchInput.displayName = 'ModuleSearchInput';
