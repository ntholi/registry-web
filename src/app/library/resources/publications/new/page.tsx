import PublicationForm from '../_components/Form';
import { createPublication } from '../_server/actions';

export default function NewPublicationPage() {
	return (
		<PublicationForm onSubmit={createPublication} title='New Publication' />
	);
}
