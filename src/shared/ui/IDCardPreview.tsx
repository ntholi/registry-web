'use client';

import { Box, Flex, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';

type IDCardPreviewProps = {
	photoUrl: string | null | undefined;
	fields: Array<{ value: string }>;
};

export default function IDCardPreview({
	photoUrl,
	fields,
}: IDCardPreviewProps) {
	return (
		<Paper
			shadow='md'
			radius={0}
			style={{
				width: '320px',
				height: '200px',
				backgroundColor: '#ffffff',
				border: '1px solid #000',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Box
				style={{
					width: '100%',
					height: '70px',
					backgroundColor: '#000000',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '4px',
				}}
			>
				<Image
					src='/images/logo-dark.png'
					alt='Limkokwing University'
					w={180}
					h={50}
					fit='contain'
				/>
			</Box>

			<Group
				align='flex-start'
				gap='sm'
				p='sm'
				style={{ height: 'calc(100% - 70px)' }}
			>
				<Box style={{ flex: 1 }}>
					{fields.map((field, idx) => (
						<Text
							key={idx}
							size={idx === 0 ? 'sm' : 'xs'}
							fw={700}
							c='black'
							lh={1.2}
						>
							{field.value}
						</Text>
					))}
				</Box>

				<Stack align='flex-end' gap={2}>
					{photoUrl ? (
						<Image
							src={photoUrl}
							alt='ID photo'
							w={90}
							h={100}
							fit='cover'
							radius={0}
							style={{ border: '1px solid #000' }}
						/>
					) : (
						<Box
							w={90}
							h={90}
							style={{
								border: '1px solid #000',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor: '#f0f0f0',
							}}
						>
							<IconCamera size={20} color='#666' />
						</Box>
					)}
				</Stack>
			</Group>

			<Box
				style={{
					position: 'absolute',
					bottom: '5px',
					left: '12px',
					right: '8px',
				}}
			>
				<Flex justify='space-between' align='end'>
					<Box>
						<Text size='6px' c='black' lh={1.2}>
							If found please return to:
						</Text>
						<Text size='6px' c='black' lh={1.2}>
							Limkokwing University Lesotho Campus
						</Text>
						<Text size='6px' c='black' lh={1.2}>
							Tel: 22315747
						</Text>
					</Box>
					<Text size='0.5rem' fw={700} c='black' ta='center' w={92} lh={1.2}>
						LUCT LESOTHO
					</Text>
				</Flex>
			</Box>
		</Paper>
	);
}
