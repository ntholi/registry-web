'use client';

import {
	Accordion,
	AccordionControl,
	AccordionItem,
	AccordionPanel,
	ActionIcon,
	Grid,
	GridCol,
	Group,
	Paper,
	Stack,
	Textarea,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import type { getClearance } from '@/modules/registry/features/registration-requests/server/clearance/actions';
import { formatDateTime } from '@/shared/lib/utils/utils';
import { FieldView } from '@/shared/ui/adease';
import Link from '@/shared/ui/Link';
import SponsorInfo from '../SponsorInfo';
import ClearanceSwitch from './ClearanceSwitch';
import { ModulesTable } from './ModulesTable';

type Props = {
	request: NonNullable<Awaited<ReturnType<typeof getClearance>>>;
	termId: number;
};

export default function ClearanceDetails({ request }: Props) {
	const [comment, setComment] = useState(request.message || undefined);
	const [accordion, setAccordion] = useState<'comments' | 'modules'>('modules');
	const { student } = request.registrationRequest;

	return (
		<Stack p='lg'>
			<Grid>
				<GridCol span={{ base: 12, md: 7 }}>
					<Paper withBorder p='md'>
						<Stack>
							<FieldView label='Student Number' underline={false}>
								<Group justify='space-between'>
									<Link href={`/students/${student.stdNo}`}>
										{student.stdNo}
									</Link>
									<Tooltip label='Copy'>
										<ActionIcon
											variant='subtle'
											color='gray'
											onClick={() => {
												navigator.clipboard.writeText(String(student.stdNo));
												notifications.show({
													message: 'Copied to clipboard',
													color: 'green',
												});
											}}
										>
											<IconCopy size={'1rem'} />
										</ActionIcon>
									</Tooltip>
								</Group>
							</FieldView>
							<FieldView label='Date Requested' underline={false}>
								{formatDateTime(request.registrationRequest.createdAt)}
							</FieldView>
							<FieldView label='Program' underline={false}>
								{request.programName}
							</FieldView>
							<SponsorInfo
								stdNo={request.registrationRequest.stdNo}
								termId={request.registrationRequest.termId}
							/>
						</Stack>
					</Paper>
				</GridCol>
				<GridCol span={{ base: 12, md: 5 }}>
					<ClearanceSwitch
						request={request}
						setAccordion={setAccordion}
						comment={comment}
					/>
				</GridCol>
			</Grid>
			<Accordion
				value={accordion}
				onChange={(it) => setAccordion(it as 'comments' | 'modules')}
				variant='separated'
			>
				<AccordionItem value='comments'>
					<AccordionControl>Comments</AccordionControl>
					<AccordionPanel>
						<Textarea
							value={comment}
							description='Optional '
							onChange={(e) => setComment(e.currentTarget.value)}
							placeholder='Why is the student not cleared?'
						/>
					</AccordionPanel>
				</AccordionItem>
				<AccordionItem value='modules'>
					<AccordionControl>Modules</AccordionControl>
					<AccordionPanel>
						<ModulesTable
							requestedModules={request.registrationRequest.requestedModules}
						/>
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</Stack>
	);
}
