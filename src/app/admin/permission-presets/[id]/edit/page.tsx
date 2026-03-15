import {
	getPreset,
	updatePreset,
} from '@auth/permission-presets/_server/actions';
import { Box } from '@mantine/core';
import { notFound } from 'next/navigation';
import { unwrap } from '@/shared/lib/utils/actionResult';
import Form from '../../_components/Form';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function EditPage({ params }: Props) {
	const { id } = await params;
	const preset = unwrap(await getPreset(id));

	if (!preset) {
		return notFound();
	}

	return (
		<Box p={'lg'}>
			<Form
				title={'Edit Permission Preset'}
				defaultValues={{
					...preset,
					description: preset.description ?? undefined,
				}}
				onSubmit={async (values) => {
					'use server';
					return unwrap(await updatePreset(id, values));
				}}
			/>
		</Box>
	);
}
