'use client';

import React from 'react';
import {
  Card,
  Text,
  Group,
  Stack,
  Badge,
  Box,
  Title,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { StudentModuleStatus } from '@/db/schema';

type SelectedModule = {
  moduleId: number;
  moduleStatus: StudentModuleStatus;
};

type ModuleWithStatus = {
  semesterModuleId: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  status: 'Compulsory' | 'Elective' | `Repeat${number}`;
  semesterNo: number;
  prerequisites?: Array<{ id: number; code: string; name: string }>;
};

type SponsorshipData = {
  sponsorId: number;
  borrowerNo?: string;
};

interface UpdateSummaryProps {
  originalModules: SelectedModule[];
  updatedModules: SelectedModule[];
  originalSponsorship?: SponsorshipData;
  updatedSponsorship?: SponsorshipData;
  availableModules: ModuleWithStatus[];
  sponsors: Array<{ id: number; name: string }>;
  semesterData: {
    semesterNo: number;
    status: 'Active' | 'Repeat';
  } | null;
}

export default function UpdateSummary({
  originalModules,
  updatedModules,
  originalSponsorship,
  updatedSponsorship,
  availableModules,
  sponsors,
  semesterData,
}: UpdateSummaryProps) {
  const getModuleName = (moduleId: number) => {
    const module = availableModules.find(
      (m) => m.semesterModuleId === moduleId
    );
    return module ? `${module.code} - ${module.name}` : `Module ${moduleId}`;
  };

  const getSponsorName = (sponsorId: number) => {
    const sponsor = sponsors.find((s) => s.id === sponsorId);
    return sponsor?.name || `Sponsor ${sponsorId}`;
  };

  const addedModules = updatedModules.filter(
    (updated) =>
      !originalModules.some(
        (original) => original.moduleId === updated.moduleId
      )
  );

  const removedModules = originalModules.filter(
    (original) =>
      !updatedModules.some((updated) => updated.moduleId === original.moduleId)
  );

  const changedModules = updatedModules.filter((updated) => {
    const original = originalModules.find(
      (o) => o.moduleId === updated.moduleId
    );
    return original && original.moduleStatus !== updated.moduleStatus;
  });

  const sponsorshipChanged =
    originalSponsorship?.sponsorId !== updatedSponsorship?.sponsorId ||
    originalSponsorship?.borrowerNo !== updatedSponsorship?.borrowerNo;

  const hasChanges =
    addedModules.length > 0 ||
    removedModules.length > 0 ||
    changedModules.length > 0 ||
    sponsorshipChanged;

  if (!hasChanges) {
    return (
      <Card withBorder p='md'>
        <Text c='dimmed' ta='center'>
          No changes detected
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder p='md'>
      <Stack gap='md'>
        <Title order={4}>Summary of Changes</Title>

        {semesterData && (
          <Box>
            <Text size='sm' c='dimmed' mb='xs'>
              Semester Status
            </Text>
            <Group>
              <Badge
                color={semesterData.status === 'Active' ? 'blue' : 'orange'}
              >
                {semesterData.status}
              </Badge>
              <Text size='sm'>Semester {semesterData.semesterNo}</Text>
            </Group>
          </Box>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
          {/* Module Changes */}
          <Box>
            <Text fw={500} mb='sm'>
              Module Changes
            </Text>
            <Stack gap='xs'>
              {addedModules.length > 0 && (
                <Box>
                  <Text size='sm' c='green' fw={500}>
                    Added Modules ({addedModules.length})
                  </Text>
                  {addedModules.map((module) => (
                    <Text key={module.moduleId} size='xs' c='dimmed' pl='sm'>
                      + {getModuleName(module.moduleId)}
                    </Text>
                  ))}
                </Box>
              )}

              {removedModules.length > 0 && (
                <Box>
                  <Text size='sm' c='red' fw={500}>
                    Removed Modules ({removedModules.length})
                  </Text>
                  {removedModules.map((module) => (
                    <Text key={module.moduleId} size='xs' c='dimmed' pl='sm'>
                      - {getModuleName(module.moduleId)}
                    </Text>
                  ))}
                </Box>
              )}

              {changedModules.length > 0 && (
                <Box>
                  <Text size='sm' c='blue' fw={500}>
                    Status Changes ({changedModules.length})
                  </Text>
                  {changedModules.map((module) => {
                    const original = originalModules.find(
                      (o) => o.moduleId === module.moduleId
                    );
                    return (
                      <Text key={module.moduleId} size='xs' c='dimmed' pl='sm'>
                        {getModuleName(module.moduleId)}:{' '}
                        {original?.moduleStatus} → {module.moduleStatus}
                      </Text>
                    );
                  })}
                </Box>
              )}

              {addedModules.length === 0 &&
                removedModules.length === 0 &&
                changedModules.length === 0 && (
                  <Text size='sm' c='dimmed'>
                    No module changes
                  </Text>
                )}
            </Stack>
          </Box>

          {/* Sponsorship Changes */}
          <Box>
            <Text fw={500} mb='sm'>
              Sponsorship Changes
            </Text>
            <Stack gap='xs'>
              {sponsorshipChanged ? (
                <>
                  {originalSponsorship?.sponsorId !==
                    updatedSponsorship?.sponsorId && (
                    <Box>
                      <Text size='sm' c='blue' fw={500}>
                        Sponsor
                      </Text>
                      <Text size='xs' c='dimmed' pl='sm'>
                        {originalSponsorship
                          ? getSponsorName(originalSponsorship.sponsorId)
                          : 'None'}{' '}
                        →{' '}
                        {updatedSponsorship
                          ? getSponsorName(updatedSponsorship.sponsorId)
                          : 'None'}
                      </Text>
                    </Box>
                  )}

                  {originalSponsorship?.borrowerNo !==
                    updatedSponsorship?.borrowerNo && (
                    <Box>
                      <Text size='sm' c='blue' fw={500}>
                        Borrower Number
                      </Text>
                      <Text size='xs' c='dimmed' pl='sm'>
                        {originalSponsorship?.borrowerNo || 'None'} →{' '}
                        {updatedSponsorship?.borrowerNo || 'None'}
                      </Text>
                    </Box>
                  )}
                </>
              ) : (
                <Text size='sm' c='dimmed'>
                  No sponsorship changes
                </Text>
              )}
            </Stack>
          </Box>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}
