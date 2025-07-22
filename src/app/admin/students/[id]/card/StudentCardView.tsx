'use client';

import { getStudent } from '@/server/students/actions';
import { Box, Grid, Group, Image, Paper, Stack, Text } from '@mantine/core';
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
          <Paper p='lg' shadow='sm' radius='md'>
            <Text size='lg' fw={600} mb='md'>
              Student Card Preview
            </Text>

            <StudentCardPreview student={student} photoUrl={photoPreview} />

            <Group mt='md'>
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
          padding: '8px',
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
        gap='md'
        p='md'
        style={{ height: 'calc(100% - 70px)' }}
      >
        <Box style={{ flex: 1 }}>
          <Text size='md' fw={700} c='black'>
            {student.name}
          </Text>
          <Text size='sm' fw={700} c='black'>
            {student.stdNo}
          </Text>
          <Text size='xs' fw={700} c='black'>
            {programCode}
          </Text>
          <Text size='xs' fw={700} c='black'>
            STUDENT
          </Text>
          <Text size='sm' fw={700} c='black'>
            {new Date().getFullYear()}
          </Text>
        </Box>

        <Stack align='flex-end' gap={4}>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt='Student photo'
              w={70}
              h={90}
              fit='cover'
              radius={0}
              style={{ border: '1px solid #000' }}
            />
          ) : (
            <Box
              w={70}
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
          <Text size='xs' fw={700} c='black' ta='right'>
            LUCT LESOTHO
          </Text>
        </Stack>
      </Group>

      <Box
        style={{
          position: 'absolute',
          bottom: '5px',
          left: '12px',
          right: '12px',
        }}
      >
        <Text size='6px' c='black'>
          If found please return to:
        </Text>
        <Text size='6px' c='black'>
          Limkokwing University, Lesotho Campus
        </Text>
        <Text size='6px' c='black'>
          Telephone Number: 22314551
        </Text>
      </Box>
    </Paper>
  );
}
