import IntakePeriodForm from '../_components/Form';
import { createIntakePeriod } from '../_server/actions';

export default function NewIntakePeriodPage() {
	return (
		<IntakePeriodForm title='New Intake Period' onSubmit={createIntakePeriod} />
	);
}
