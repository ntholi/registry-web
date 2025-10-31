'use client';

import { MultiSelect, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { modules, semesterModules } from '@/db/schema';
import { findModulesByStructure } from '@/server/semester-modules/actions';

type SemesterModule = typeof semesterModules.$inferInsert & {
	prerequisiteCodes?: string[];
	module: typeof modules.$inferSelect;
};

type Props = {
	defaultValues?: SemesterModule;
	structureId: number;
	onSubmit: (values: SemesterModule) => Promise<SemesterModule>;
};

export default function ModuleEditForm({ defaultValues, structureId, onSubmit }: Props) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: modulesList } = useQuery({
		queryKey: ['modules', structureId],
		queryFn: () => findModulesByStructure(structureId),
	});

	const prerequisiteOptions = Array.from(new Set(modulesList?.map((mod) => mod.module!.code) || []))
		.map((code) => {
			const foundModule = modulesList?.find((m) => m.module!.code === code);
			if (!foundModule) return null;
			return {
				value: code,
				label: `${foundModule.module!.code} - ${foundModule.module!.name}`,
			};
		})
		.filter(Boolean) as { value: string; label: string }[];

	const form = useForm<SemesterModule>({
		initialValues: defaultValues,
	});

	const handleSubmit = async (values: SemesterModule) => {
		try {
			setIsSubmitting(true);
			await onSubmit(values);
			notifications.show({
				title: 'Success',
				message: 'Module updated successfully',
				color: 'green',
			});
			modals.closeAll();
			router.refresh();
		} catch (error) {
			notifications.show({
				title: 'Error',
				message: error instanceof Error ? error.message : 'Failed to update module',
				color: 'red',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form id='module-edit-form' onSubmit={form.onSubmit(handleSubmit)}>
			<Stack gap='md'>
				<div>
					<Text size='sm' fw={500} mb='xs'>
						Module Visibility
					</Text>
					<Radio.Group
						value={form.values.hidden ? 'not-visible' : 'visible'}
						onChange={(value) => form.setFieldValue('hidden', value === 'not-visible')}
					>
						<Stack gap='xs'>
							<Radio value='visible' label='Visible' disabled={isSubmitting} />
							<Radio value='not-visible' label='Not Visible' disabled={isSubmitting} />
						</Stack>
					</Radio.Group>
					<Text size='xs' c='dimmed' mt='xs'>
						If not visible, students will not be able to register for this module
					</Text>
				</div>
				<MultiSelect
					label='Prerequisites'
					data={prerequisiteOptions}
					searchable
					clearSearchOnChange={false}
					hidePickedOptions
					disabled={isSubmitting}
					{...form.getInputProps('prerequisiteCodes')}
				/>
			</Stack>
		</form>
	);
}
