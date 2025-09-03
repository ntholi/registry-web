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
        color='orange'
        variant='light'
      >
        <Stack gap='sm'>
          <Text size='sm'>
            Please carefully verify that your personal information below is
            correct.
          </Text>
          <Text size='sm'>
            If this information is <strong>not</strong> correct, you must report
            to the Registry Department before the clearance deadline. This
            information <strong>cannot</strong> be corrected after the clearance
            deadline has passed.
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
              <Text size='xs' c='dimmed'>
                Full Name
              </Text>
              <Text fw={500}>{student.name}</Text>
            </Box>
          </Group>

          <Group>
            <IconId size='1.2rem' color='gray' />
            <Box>
              <Text size='xs' c='dimmed'>
                National ID Number
              </Text>
              <Text fw={500}>{student.nationalId || 'Not provided'}</Text>
            </Box>
          </Group>

          <Group>
            {student.gender === 'Male' ? (
              <IconGenderMale size='1.2rem' color='gray' />
            ) : (
              <IconGenderFemale size='1.2rem' color='gray' />
            )}
            <Box>
              <Text size='xs' c='dimmed'>
                Gender
              </Text>
              <Text fw={500}>{student.gender || 'Not specified'}</Text>
            </Box>
          </Group>

          <Group>
            <IconId size='1.2rem' color='gray' />
            <Box>
              <Text size='xs' c='dimmed'>
                Student Number
              </Text>
              <Text fw={500}>{student.stdNo}</Text>
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

          <Text fw={500} c='red' size='sm'>
            Type exactly &quot;information correct&quot; (without quotes) to
            confirm:
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
    </Stack>
  );
}
