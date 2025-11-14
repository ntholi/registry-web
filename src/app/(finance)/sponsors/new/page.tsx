import { Form } from '@finance/sponsors';
import { Box } from '@mantine/core';
import { createSponsor } from '@/modules/finance/features/sponsors/server/actions';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Sponsor'} onSubmit={createSponsor} />
		</Box>
	);
}
