import { Container } from '@mantine/core';
import LibrarySettingsForm from './_components/LibrarySettingsForm';
import { getLibrarySettings } from './_server/actions';

export default async function LibrarySettingsPage() {
	const settings = await getLibrarySettings();

	return (
		<Container size='sm' py='xl'>
			<LibrarySettingsForm initialData={settings} />
		</Container>
	);
}
