'use client';

import { Menu } from '@mantine/core';
import { useQueryState } from 'nuqs';
import { FilterButton } from './FilterButton';

type FilterOption = {
	value: string;
	label: string;
	color?: string;
};

export type FilterMenuProps = {
	label: string;
	options: FilterOption[];
	queryParam: string;
	defaultValue?: string;
};

export function FilterMenu({
	label,
	options,
	queryParam,
	defaultValue,
}: FilterMenuProps) {
	const [value, setValue] = useQueryState(queryParam, {
		defaultValue: defaultValue ?? '',
		shallow: false,
	});

	const activeCount = value && value !== (defaultValue ?? '') ? 1 : 0;
	const current = value || defaultValue || '';

	return (
		<Menu position='bottom-end'>
			<Menu.Target>
				<FilterButton
					label={label}
					activeCount={activeCount}
					onClick={() => {}}
				/>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>{label}</Menu.Label>
				{options.map((option) => {
					const isSelected = current === option.value;
					return (
						<Menu.Item
							key={option.value}
							onClick={() =>
								setValue(option.value === defaultValue ? null : option.value)
							}
							color={option.color}
							bg={
								isSelected && option.color
									? `var(--mantine-color-${option.color}-light)`
									: isSelected
										? 'var(--mantine-color-default-hover)'
										: undefined
							}
						>
							{option.label}
						</Menu.Item>
					);
				})}
			</Menu.Dropdown>
		</Menu>
	);
}
