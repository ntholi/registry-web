'use client';

import {
	type PermissionPresetDetail,
	type PresetFormValues,
	presetFormSchema,
} from '@auth/permission-presets/_lib/types';
import { Select, Textarea, TextInput } from '@mantine/core';
import { useRouter } from 'nextjs-toploader/app';
import PermissionMatrix from '@/app/auth/_components/PermissionMatrix';
import { DASHBOARD_ROLES } from '@/core/auth/permissions';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { Form } from '@/shared/ui/adease';

type Props = {
	onSubmit: (values: PresetFormValues) => Promise<PermissionPresetDetail>;
	defaultValues?: Partial<PresetFormValues>;
	title?: string;
};

export default function PermissionPresetForm({
	onSubmit,
	defaultValues,
	title,
}: Props) {
	const router = useRouter();

	return (
		<Form<PresetFormValues, Partial<PresetFormValues>, PermissionPresetDetail>
			title={title}
			action={onSubmit}
			queryKey={['permission-presets']}
			schema={presetFormSchema}
			defaultValues={{
				permissions: [],
				...defaultValues,
			}}
			onSuccess={({ id }) => {
				router.push(`/admin/permission-presets/${id}`);
			}}
		>
			{(form) => (
				<>
					<TextInput label='Name' {...form.getInputProps('name')} />
					<Select
						label='Role'
						searchable
						data={DASHBOARD_ROLES.map((role) => ({
							value: role,
							label: toTitleCase(role),
						}))}
						{...form.getInputProps('role')}
					/>
					<Textarea
						label='Description'
						autosize
						minRows={3}
						{...form.getInputProps('description')}
					/>
					<PermissionMatrix
						permissions={form.values.permissions ?? []}
						onChange={(permissions) => {
							form.setFieldValue('permissions', permissions);
						}}
					/>
				</>
			)}
		</Form>
	);
}
