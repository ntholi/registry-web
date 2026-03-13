import {
	deletePreset,
	getPreset,
} from '@auth/permission-presets/_server/actions';
import { Badge } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getRoleColor } from '@/shared/lib/utils/colors';
import { toTitleCase } from '@/shared/lib/utils/utils';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function PresetDetails({ params }: Props) {
	const { id } = await params;
	const preset = await getPreset(id);

	if (!preset) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title={'Permission Preset'}
				queryKey={['permission-presets']}
				handleDelete={async () => {
					'use server';
					await deletePreset(id);
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{preset.name}</FieldView>
				<FieldView label='Role'>
					<Badge color={getRoleColor(preset.role)} variant='light'>
						{toTitleCase(preset.role)}
					</Badge>
				</FieldView>
				<FieldView label='Description'>{preset.description || '-'}</FieldView>
				<FieldView label='Permissions'>
					{preset.permissionCount} granted
				</FieldView>
			</DetailsViewBody>
		</DetailsView>
	);
}
