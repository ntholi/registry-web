import { createSponsor, Form } from '@finance/sponsors';
import { Box } from '@mantine/core';

export default async function NewPage() {
	return (
		<Box p={'lg'}>
			<Form title={'Create Sponsor'} onSubmit={createSponsor} />
		</Box>
	);
}
