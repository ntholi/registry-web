import { Grid, GridCol, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import { DetailsView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import AcademicDataPanel from '../_components/AcademicDataPanel';
import DocumentReviewHeader from '../_components/DocumentReviewHeader';
import DocumentViewer from '../_components/DocumentViewer';
import IdentityDataPanel from '../_components/IdentityDataPanel';
import {
	getDocumentForReview,
	updateDocumentRotation,
} from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function DocumentReviewPage({ params }: Props) {
	const { id } = await params;
	const doc = await getDocumentForReview(id);

	if (!doc) return notFound();

	const isIdentity = doc.document.type === 'identity';
	const isAcademic =
		doc.document.type === 'certificate' ||
		doc.document.type === 'academic_record';
	const title = isIdentity
		? 'Identity Document'
		: isAcademic
			? 'Academic Document'
			: 'Document';

	return (
		<DetailsView>
			<DocumentReviewHeader
				id={id}
				title={title}
				status={doc.verificationStatus}
			/>
			<Grid gutter='md'>
				<GridCol span={{ base: 12, md: 7 }}>
					{doc.document.fileUrl ? (
						<DocumentViewer
							src={doc.document.fileUrl}
							alt={doc.document.fileName}
							initialRotation={doc.rotation}
							onRotationChange={async (rotation) => {
								'use server';
								await updateDocumentRotation(id, rotation);
							}}
						/>
					) : (
						<Paper
							withBorder
							radius='md'
							p='xl'
							style={{
								minHeight: 500,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text c='dimmed' fs='italic'>
								No document image available
							</Text>
						</Paper>
					)}
				</GridCol>
				<GridCol span={{ base: 12, md: 5 }}>
					<Paper withBorder radius='md' p='md' h='100%'>
						<ScrollArea h={600} offsetScrollbars>
							<Stack gap='lg'>
								<Stack gap={4}>
									<Text size='xs' c='dimmed'>
										Applicant
									</Text>
									<Link href={`/admissions/applicants/${doc.applicant.id}`}>
										<Text size='sm' fw={500}>
											{doc.applicant.fullName}
										</Text>
									</Link>
								</Stack>

								{isIdentity && <IdentityDataPanel applicant={doc.applicant} />}

								{isAcademic && (
									<AcademicDataPanel records={doc.academicRecords} />
								)}

								{!isIdentity && !isAcademic && (
									<Text size='sm' c='dimmed' fs='italic'>
										No extractable data for this document type
									</Text>
								)}
							</Stack>
						</ScrollArea>
					</Paper>
				</GridCol>
			</Grid>
		</DetailsView>
	);
}
