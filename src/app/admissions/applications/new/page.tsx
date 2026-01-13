import ApplicationForm from '../_components/Form';
import { createApplication } from '../_server/actions';

export default function NewApplicationPage() {
	return (
		<ApplicationForm title='New Application' onSubmit={createApplication} />
	);
}
