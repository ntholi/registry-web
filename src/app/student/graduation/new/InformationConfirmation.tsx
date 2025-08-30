'use client';

import React, { useState } from 'react';
import { students } from '@/db/schema';
import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
  Checkbox,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconUser,
  IconId,
  IconGenderMale,
  IconGenderFemale,
} from '@tabler/icons-react';

type Student = typeof students.$inferSelect & {
  user?: { name?: string | null } | null;
};

interface InformationConfirmationProps {
  student: Student;
  confirmed: boolean;
  onConfirm: (confirmed: boolean) => void;
}

export default function InformationConfirmation({
  student,
  confirmed,
  onConfirm,
}: InformationConfirmationProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasTypedCorrectly, setHasTypedCorrectly] = useState(false);

  const handleConfirmationTextChange = (value: string) => {
    setConfirmationText(value);
    const isCorrect = value.toLowerCase() === 'information correct';
    setHasTypedCorrectly(isCorrect);

    if (isCorrect) {
      onConfirm(true);
    } else {
      onConfirm(false);
    }
  };

  return (
    <Stack gap='lg'>
      <Alert
        icon={<IconAlertTriangle size='1.5rem' />}
        title='Verify Your Information'
        color='red'
        variant='light'
      >
        <Stack gap='sm'>
          <Text>
            Please carefully verify that your personal information below is
            correct.
          </Text>
          <Text>
            If this information is NOT correct, you must report to the Registry
            Department before the clearance deadline. This information CANNOT be
            corrected after the clearance deadline has passed.
          </Text>
        </Stack>
      </Alert>

      <Card withBorder shadow='sm' radius='md' padding='lg'>
        <Title order={3} mb='md'>
          Your Information
        </Title>

        <Stack gap='md'>
          <Group>
            <IconUser size='1.2rem' color='gray' />
            <Box>
              <Text size='sm' c='dimmed'>
                Full Name
              </Text>
              <Text fw={500} size='lg'>
                {student.user?.name || student.name}
              </Text>
            </Box>
          </Group>

          <Group>
            <IconId size='1.2rem' color='gray' />
            <Box>
              <Text size='sm' c='dimmed'>
                National ID Number
              </Text>
              <Text fw={500} size='lg'>
                {student.nationalId || 'Not provided'}
              </Text>
            </Box>
          </Group>

          <Group>
            {student.gender === 'Male' ? (
              <IconGenderMale size='1.2rem' color='gray' />
            ) : (
              <IconGenderFemale size='1.2rem' color='gray' />
            )}
            <Box>
              <Text size='sm' c='dimmed'>
                Gender
              </Text>
              <Text fw={500} size='lg'>
                {student.gender || 'Not specified'}
              </Text>
            </Box>
          </Group>

          <Group>
            <IconId size='1.2rem' color='gray' />
            <Box>
              <Text size='sm' c='dimmed'>
                Student Number
              </Text>
              <Text fw={500} size='lg'>
                {student.stdNo}
              </Text>
            </Box>
          </Group>
        </Stack>
      </Card>

      <Card withBorder shadow='sm' radius='md' padding='lg'>
        <Title order={4} mb='md'>
          Confirmation Required
        </Title>

        <Stack gap='md'>
          <Text>
            To proceed with your graduation clearance, please verify that ALL
            the information above is correct.
          </Text>

          <Text fw={500} c='red'>
            Type exactly "information correct" (without quotes) to confirm:
          </Text>

          <TextInput
            placeholder='Type "information correct" here...'
            value={confirmationText}
            onChange={(event) =>
              handleConfirmationTextChange(event.currentTarget.value)
            }
            error={
              confirmationText.length > 0 && !hasTypedCorrectly
                ? 'Please type exactly "information correct"'
                : null
            }
            data-testid='confirmation-input'
          />

          <Checkbox
            checked={confirmed && hasTypedCorrectly}
            disabled={!hasTypedCorrectly}
            onChange={() => {}}
            label={
              <Text size='sm'>
                I confirm that all my personal information displayed above is
                correct and accurate
              </Text>
            }
          />
        </Stack>
      </Card>

      {/* Additional Warning */}
      <Alert color='orange' variant='light'>
        <Text size='sm'>
          <strong>Remember:</strong> If any of this information is incorrect,
          contact the Registry Department immediately. Once the clearance
          deadline passes, no corrections can be made.
        </Text>
      </Alert>
    </Stack>
  );
}
