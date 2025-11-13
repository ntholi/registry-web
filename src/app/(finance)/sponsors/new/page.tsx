import { Box } from '@mantine/core';
import Form from '@/modules/finance/features/sponsors/components/Form';
import { createSponsor } from '@/modules/finance/features/sponsors/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Sponsor'} onSubmit={createSponsor} />
		</Box>
	);
}
