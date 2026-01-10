import ExternalLibraryForm from '../_components/Form';
import { createExternalLibrary } from '../_server/actions';

export default function NewExternalLibraryPage() {
	return (
		<ExternalLibraryForm
			title='New External Library'
			onSubmit={createExternalLibrary}
		/>
	);
}
