'use client';

import { getStudent } from '@/server/students/actions';
import {
  Box,
  Flex,
  Grid,
  Group,
  Image,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
import { useState } from 'react';
import StudentCardPrinter from './StudentCardPrinter';
import PhotoSelection from './PhotoSelection';

type StudentCardViewProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  isActive: boolean;
};

export default function StudentCardView({
  student,
  isActive,
}: StudentCardViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (file: File | null, preview: string | null) => {
    setSelectedPhoto(file);
    setPhotoPreview(preview);
  };

  if (!isActive) {
    return null;
  }

  return (
    <Box>
      <Grid>
        <Grid.Col span={6}>
          <PhotoSelection
            selectedPhoto={selectedPhoto}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
            studentNumber={student.stdNo}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p='md' shadow='sm' radius='md'>
            <Text size='lg' fw={600} mb='sm'>
              Student Card Preview
            </Text>
            <StudentCardPreview student={student} photoUrl={photoPreview} />
            <Group mt='sm'>
              <StudentCardPrinter
                student={student}
                photoUrl={photoPreview}
                disabled={!photoPreview}
              />
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

type StudentCardPreviewProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  photoUrl: string | null;
};

function StudentCardPreview({ student, photoUrl }: StudentCardPreviewProps) {
  const activeProgram = student.programs?.find((p) => p.status === 'Active');
  const programCode = activeProgram?.structure?.program?.code || 'N/A';

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
          <Text size='sm' fw={700} c='black' lh={1.2}>
            {student.name}
          </Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>
            {student.stdNo}
          </Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>
            {programCode}
          </Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>
            STUDENT
          </Text>
          <Text size='xs' fw={700} c='black' lh={1.2}>
            {new Date().getFullYear()}
          </Text>
        </Box>

        <Stack align='flex-end' gap={2}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt='Student photo'
              w={90}
              h={120}
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
        <Flex justify={'space-between'} align={'end'}>
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
