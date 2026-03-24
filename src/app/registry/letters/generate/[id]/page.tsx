import { Group } from '@mantine/core';
import { notFound } from 'next/navigation';
import { formatDateTime } from '@/shared/lib/utils/dates';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import LetterPreview from '../../_components/LetterPreview';
import LetterPrinter from '../../_components/LetterPrinter';
import { deleteLetter, getLetter } from '../../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function LetterDetailPage({ params }: Props) {
	const { id } = await params;
	const letter = await getLetter(id);

	if (!letter) return notFound();

	return (
		<DetailsView>
			<DetailsViewHeader
				title={letter.serialNumber}
				queryKey={['letters']}
				handleDelete={async () => {
					'use server';
					return deleteLetter(id);
				}}
				hideEdit
				actions={
					<LetterPrinter
						content={letter.content}
						serialNumber={letter.serialNumber}
						recipient={letter.recipient}
						salutation={letter.salutation}
						subject={letter.subject}
						signOffName={letter.template?.signOffName}
						signOffTitle={letter.template?.signOffTitle}
					/>
				}
			/>
			<DetailsViewBody>
				<Group grow>
					<FieldView label='Serial Number'>{letter.serialNumber}</FieldView>
					<FieldView label='Template'>
						{letter.template ? (
							<Link
								href={`/registry/letters/templates/${letter.template.id}`}
								size='sm'
							>
								{letter.template.name}
							</Link>
						) : (
							'Unknown'
						)}
					</FieldView>
				</Group>
				<Group grow>
					<FieldView label='Created By'>
						{letter.creator?.name ?? 'Unknown'}
					</FieldView>

					<FieldView label='Created'>
						{formatDateTime(letter.createdAt)}
					</FieldView>
				</Group>
				<LetterPreview
					content={letter.content}
					recipient={letter.recipient}
					salutation={letter.salutation}
					subject={letter.subject}
					signOffName={letter.template?.signOffName}
					signOffTitle={letter.template?.signOffTitle}
				/>
			</DetailsViewBody>
		</DetailsView>
	);
}
