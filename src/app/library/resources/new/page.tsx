import ResourceForm from '../_components/Form';
import { createResource } from '../_server/actions';

export default function NewResourcePage() {
	return <ResourceForm onSubmit={createResource} title='Upload New Resource' />;
}
