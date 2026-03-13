import { createPreset } from '@auth/permission-presets/_server/actions';
import { Box } from '@mantine/core';
import Form from '../_components/Form';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Permission Preset'} onSubmit={createPreset} />
		</Box>
	);
}
