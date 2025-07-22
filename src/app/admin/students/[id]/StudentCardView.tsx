'use client';

import { getStudent } from '@/server/students/actions';
import {
  Box,
  FileInput,
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

  const handlePhotoChange = (file: File | null) => {
    setSelectedPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <Box>
      <Grid>
        <Grid.Col span={6}>
          <Paper p='lg' shadow='sm' radius='md'>
            <Text size='lg' fw={600} mb='md'>
              Photo Selection
            </Text>

            <FileInput
              label='Student Photo'
              placeholder='Click to select photo'
              accept='image/*'
              leftSection={<IconCamera size={16} />}
              value={selectedPhoto}
              onChange={handlePhotoChange}
              mb='md'
            />

            {photoPreview && (
              <Box>
                <Text size='sm' mb='xs'>
                  Preview:
                </Text>
                <Image
                  src={photoPreview}
                  alt='Student photo preview'
                  w={150}
                  h={200}
                  fit='cover'
                  radius='md'
                />
              </Box>
            )}
          </Paper>
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
  const programName = activeProgram?.structure?.program?.name || 'N/A';

  return (
    <Paper
      p='md'
      shadow='md'
      radius='md'
      style={{
        width: '320px',
        height: '200px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
      }}
    >
      <Stack gap='xs'>
        <Group justify='space-between' align='flex-start'>
          <Box>
            <Text size='xs' fw={700}>
              LIMKOKWING UNIVERSITY
            </Text>
            <Text size='xs'>Student ID Card</Text>
          </Box>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt='Student photo'
              w={60}
              h={80}
              fit='cover'
              radius='sm'
            />
          ) : (
            <Box
              w={60}
              h={80}
              style={{
                border: '2px dashed rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
            >
              <IconCamera size={24} opacity={0.5} />
            </Box>
          )}
        </Group>

        <Stack gap={2} mt='xs'>
          <Text size='sm' fw={600}>
            {student.name}
          </Text>
          <Text size='xs'>ID: {student.stdNo}</Text>
          <Text size='xs'>Program: {programName}</Text>
          <Text size='xs'>Valid: {new Date().getFullYear()}</Text>
        </Stack>
      </Stack>
    </Paper>
  );
}
