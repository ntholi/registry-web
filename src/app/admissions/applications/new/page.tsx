import { findActiveIntakePeriod } from '../../intake-periods/_server/actions';
import ApplicationForm from '../_components/Form';
import { createApplication } from '../_server/actions';

export default async function NewApplicationPage() {
	const activeIntake = await findActiveIntakePeriod();

	return (
		<ApplicationForm
			title='New Application'
			onSubmit={createApplication}
			defaultValues={{ intakePeriodId: activeIntake?.id }}
		/>
	);
}
