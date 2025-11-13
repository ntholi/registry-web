'use client';

import { MultiSelect, NumberInput, Select } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { z } from 'zod';
import { moduleType, semesterModules } from '@/core/database/schema';
import { findAllModules } from '@/modules/academic/features/semester-modules/server/actions';
import { Form } from '@/shared/components/adease';

type Module = typeof semesterModules.$inferInsert;

type Props = {
	onSubmit: (
		values: Module & { prerequisiteCodes?: string[] }
	) => Promise<Module>;
	defaultValues?: Module & { prerequisiteCodes?: string[] };
	onSuccess?: (value: Module) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function ModuleForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

	const { data: modulesList } = useQuery({
		queryKey: ['modules', debouncedSearch],
		queryFn: () => findAllModules(1, debouncedSearch),
	});

	const prerequisiteOptions = Array.from(
		new Set(modulesList?.items.map((mod) => mod.module!.code))
	)
		.map((code) => {
			const foundModule = modulesList?.items.find(
				(m) => m.module!.code === code
			);
			if (!foundModule) return null;
			return {
				value: code,
				label: `${foundModule.module!.code} - ${foundModule.module!.name}`,
			};
		})
		.filter(Boolean) as { value: string; label: string }[];

	const schema = z.object({
		...createInsertSchema(semesterModules).shape,
		prerequisiteCodes: z.array(z.string()).optional(),
	});

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['semester-modules']}
			schema={schema}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/semester-modules/${id}`);
			}}
		>
			{(form) => (
				<>
					<NumberInput label='Module Id' {...form.getInputProps('moduleId')} />
					<Select
						label='Type'
						data={moduleType.enumValues.map((type) => ({
							value: type,
							label: type,
						}))}
						{...form.getInputProps('type')}
					/>
					<NumberInput label='Credits' {...form.getInputProps('credits')} />
					<MultiSelect
						label='Prerequisites'
						placeholder='Select module prerequisites'
						data={prerequisiteOptions}
						searchable
						onSearchChange={setSearchQuery}
						{...form.getInputProps('prerequisiteCodes')}
					/>
				</>
			)}
		</Form>
	);
}
