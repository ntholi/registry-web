'use client';

import { Grid, NumberInput, Select, TextInput } from '@mantine/core';
import { createInsertSchema } from 'drizzle-zod';
import { useRouter } from 'nextjs-toploader/app';
import { Form } from '@/shared/components/adease';
import { modules } from '@/db/schema';

type Module = typeof modules.$inferInsert;

type Props = {
	onSubmit: (values: Module) => Promise<Module>;
	defaultValues?: Module;
	onSuccess?: (value: Module) => void;
	onError?: (
		error: Error | React.SyntheticEvent<HTMLDivElement, Event>
	) => void;
	title?: string;
};

export default function ModuleForm({ onSubmit, defaultValues, title }: Props) {
	const router = useRouter();

	return (
		<Form
			title={title}
			action={onSubmit}
			queryKey={['modules']}
			schema={createInsertSchema(modules)}
			defaultValues={defaultValues}
			onSuccess={({ id }) => {
				router.push(`/modules/${id}`);
			}}
		>
			{(form) => (
				<>
					<NumberInput label='ID' {...form.getInputProps('id')} />
					<Grid>
						<Grid.Col span={3}>
							<TextInput label='Code' {...form.getInputProps('code')} />
						</Grid.Col>
						<Grid.Col span={9}>
							<TextInput label='Name' {...form.getInputProps('name')} />
						</Grid.Col>
					</Grid>
					<Select
						label='Status'
						searchable
						defaultValue='Active'
						{...form.getInputProps('status')}
						data={['Active', 'Defunct']}
					/>
				</>
			)}
		</Form>
	);
}
