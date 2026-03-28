import { Box } from '@mantine/core';
import ReferralForm from '../_components/ReferralForm';
import { createReferral } from '../_server/actions';

export default function NewReferralPage() {
	return (
		<Box p='lg'>
			<ReferralForm title='New Referral' onSubmit={createReferral} />
		</Box>
	);
}
