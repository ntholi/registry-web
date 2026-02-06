import { Container, Title } from '@mantine/core';
import CatalogTabs from './_components/CatalogTabs';
import { getCatalogBooks, getCatalogPublications } from './_server/actions';

export default async function CatalogPage() {
	const [books, publications] = await Promise.all([
		getCatalogBooks(),
		getCatalogPublications(),
	]);

	return (
		<Container size='xl' py='md'>
			<Title order={2} mb='lg'>
				Library Catalog
			</Title>
			<CatalogTabs initialBooks={books} initialPublications={publications} />
		</Container>
	);
}
