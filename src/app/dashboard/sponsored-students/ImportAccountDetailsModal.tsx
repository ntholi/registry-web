'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  FileInput,
  Alert,
  Progress,
  Table,
  Group,
  Badge,
  ActionIcon,
  Paper,
  ScrollArea,
  Title,
} from '@mantine/core';
import {
  IconUpload,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconFileSpreadsheet,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import {
  updateAccountDetails,
  bulkUpdateAccountDetails,
} from '@/server/sponsors/actions';

interface ImportRow {
  stdNo: string;
  name: string;
  accountNumber: string;
  bankName: string;
}

interface ProcessedRow extends ImportRow {
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function ImportAccountDetailsModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ProcessedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const queryClient = useQueryClient();

  const BATCH_SIZE = 50; // Process 50 records at a time

  const updateMutation = useMutation({
    mutationFn: ({
      items,
      batchSize,
    }: {
      items: Array<{
        stdNoOrName: string;
        bankName: string;
        accountNumber: string;
      }>;
      batchSize: number;
    }) => bulkUpdateAccountDetails(items, batchSize),
  });

  const parseExcelFile = async (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const rows: ImportRow[] = [];
          let foundDataStart = false;
          let stdNoIndex = -1;
          let nameIndex = -1;
          let accountNumberIndex = -1;
          let bankNameIndex = -1;

          for (let i = 0; i < json.length; i++) {
            const row = json[i] as string[];

            if (!foundDataStart) {
              const stdNoCol = row.findIndex((cell) => {
                if (typeof cell !== 'string') return false;
                const cellLower = cell.toLowerCase().trim();
                return (
                  (cellLower.includes('student') && cellLower.includes('no')) ||
                  cellLower === 'std no' ||
                  cellLower === 'student no' ||
                  cellLower === 'student no.'
                );
              });
              const nameCol = row.findIndex((cell) => {
                if (typeof cell !== 'string') return false;
                const cellLower = cell.toLowerCase().trim();
                return (
                  (cellLower.includes('name') && !cellLower.includes('bank')) ||
                  cellLower === 'names' ||
                  cellLower.includes('names in full')
                );
              });
              const accountCol = row.findIndex((cell) => {
                if (typeof cell !== 'string') return false;
                const cellLower = cell.toLowerCase().trim();
                return (
                  cellLower.includes('account') ||
                  cellLower === 'account no' ||
                  cellLower === 'account no.'
                );
              });
              const bankCol = row.findIndex((cell) => {
                if (typeof cell !== 'string') return false;
                const cellLower = cell.toLowerCase().trim();
                return (
                  cellLower.includes('bank') ||
                  cellLower === 'bank' ||
                  cellLower === 'bank name'
                );
              });

              if (
                stdNoCol >= 0 &&
                nameCol >= 0 &&
                accountCol >= 0 &&
                bankCol >= 0
              ) {
                stdNoIndex = stdNoCol;
                nameIndex = nameCol;
                accountNumberIndex = accountCol;
                bankNameIndex = bankCol;
                foundDataStart = true;
                continue;
              }
            }

            if (foundDataStart && row.length > 0) {
              const stdNo = row[stdNoIndex]?.toString().trim();
              const name = row[nameIndex]?.toString().trim();
              const accountNumber = row[accountNumberIndex]?.toString().trim();
              const bankName = row[bankNameIndex]?.toString().trim();

              if (
                stdNo &&
                name &&
                accountNumber &&
                bankName &&
                stdNo !== 'undefined' &&
                name !== 'undefined' &&
                accountNumber !== 'undefined' &&
                bankName !== 'undefined' &&
                stdNo.length > 0 &&
                name.length > 0 &&
                accountNumber.length > 0 &&
                bankName.length > 0
              ) {
                rows.push({
                  stdNo,
                  name,
                  accountNumber,
                  bankName,
                });
              }
            }
          }

          if (!foundDataStart) {
            throw new Error(
              'Could not find required columns. Please ensure your Excel file has columns for Student No, Names, Account Number, and Bank Name.'
            );
          }

          if (rows.length === 0) {
            throw new Error('No valid data rows found in the Excel file.');
          }

          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setImportData([]);
      return;
    }

    try {
      const data = await parseExcelFile(file);
      const processedData: ProcessedRow[] = data.map((row) => ({
        ...row,
        status: 'pending',
      }));
      setImportData(processedData);
      setFile(file);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to parse Excel file. Please check the format.',
        color: 'red',
        icon: <IconX size='1rem' />,
      });
    }
  };

  const processImport = async () => {
    if (importData.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    const requestData = importData.map((row) => ({
      stdNoOrName: row.stdNo,
      bankName: row.bankName,
      accountNumber: row.accountNumber,
    }));

    const totalBatches = Math.ceil(requestData.length / BATCH_SIZE);
    setTotalBatches(totalBatches);
    setCurrentBatch(0);

    let allResults: any[] = [];
    let processedCount = 0;
    const updatedData = [...importData];

    try {
      // Process in batches for better performance and progress tracking
      for (let i = 0; i < requestData.length; i += BATCH_SIZE) {
        const batch = requestData.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        setCurrentBatch(batchNumber);

        try {
          const batchResults = await updateMutation.mutateAsync({
            items: batch,
            batchSize: BATCH_SIZE,
          });

          // Update UI with batch results
          batchResults.forEach((result, batchIndex) => {
            const overallIndex = i + batchIndex;
            if (result.success) {
              updatedData[overallIndex] = {
                ...updatedData[overallIndex],
                status: 'success',
              };
            } else {
              updatedData[overallIndex] = {
                ...updatedData[overallIndex],
                status: 'error',
                error: result.error || 'Failed to update',
              };
            }
          });

          allResults.push(...batchResults);
          processedCount += batch.length;

          // Update progress and UI
          const progressPercentage =
            (processedCount / requestData.length) * 100;
          setProgress(progressPercentage);
          setImportData([...updatedData]);

          // Small delay to allow UI updates
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (batchError) {
          // Mark all items in this batch as errors
          for (let j = 0; j < batch.length; j++) {
            const overallIndex = i + j;
            if (overallIndex < updatedData.length) {
              updatedData[overallIndex] = {
                ...updatedData[overallIndex],
                status: 'error',
                error: 'Batch processing failed',
              };
            }
          }
          setImportData([...updatedData]);
        }
      }

      const successCount = allResults.filter((r) => r.success).length;
      const errorCount = allResults.filter((r) => !r.success).length;

      notifications.show({
        title: 'Import Complete',
        message: `${successCount} records updated successfully, ${errorCount} failed out of ${requestData.length} total records.`,
        color: errorCount > 0 ? 'orange' : 'green',
        icon: <IconCheck size='1rem' />,
      });

      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['all-sponsored-students'] });
      }
    } catch (error) {
      notifications.show({
        title: 'Import Failed',
        message: 'An error occurred during the import process.',
        color: 'red',
        icon: <IconX size='1rem' />,
      });
    } finally {
      setIsProcessing(false);
      setCurrentBatch(0);
      setTotalBatches(0);
      setProgress(100);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportData([]);
    setProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setIsProcessing(false);
    close();
  };

  const successCount = importData.filter(
    (row) => row.status === 'success'
  ).length;
  const errorCount = importData.filter((row) => row.status === 'error').length;
  const pendingCount = importData.filter(
    (row) => row.status === 'pending'
  ).length;

  return (
    <>
      <Button
        leftSection={<IconUpload size='1rem' />}
        onClick={open}
        variant='light'
      >
        Import Account Details
      </Button>

      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap='sm'>
            <IconFileSpreadsheet size='1.2rem' />
            <Title order={4}>Import Account Details</Title>
          </Group>
        }
        size='xl'
        centered
      >
        <Stack gap='md'>
          <Alert icon={<IconAlertCircle size='1rem' />} color='blue'>
            Upload an Excel file with columns for:{' '}
            <strong>Student Number</strong>, <strong>Names</strong>,{' '}
            <strong>Account Number</strong>, and <strong>Bank Name</strong>. The
            system will search by student number first, then by name if not
            found.
            <br />
            <br />
            <strong>Supported column headers:</strong> "Student No", "Names in
            Full", "Account No.", "Bank", etc.
            <br />
            <strong>Example format:</strong> STUDENT NO | NAMES IN FULL |
            ACCOUNT NO. | BANK
          </Alert>

          <FileInput
            label='Excel File'
            placeholder='Select an Excel file'
            accept='.xlsx,.xls'
            value={file}
            onChange={handleFileUpload}
            disabled={isProcessing}
          />

          {isProcessing && (
            <Stack gap='xs'>
              <Group justify='space-between'>
                <Text size='sm'>Processing import...</Text>
                <Text size='xs' c='dimmed'>
                  {totalBatches > 0 && (
                    <>
                      Batch {currentBatch} of {totalBatches} ({BATCH_SIZE}{' '}
                      records per batch)
                    </>
                  )}
                </Text>
              </Group>
              <Progress value={progress} size='sm' />
              <Text size='xs' c='dimmed' ta='center'>
                {Math.round(progress)}% complete
                {importData.length > 0 && (
                  <>
                    {' '}
                    • {
                      importData.filter((r) => r.status === 'success').length
                    }{' '}
                    success,{' '}
                    {importData.filter((r) => r.status === 'error').length}{' '}
                    errors
                  </>
                )}
              </Text>
            </Stack>
          )}

          {importData.length > 0 && (
            <Paper withBorder p='md'>
              <Group justify='space-between' mb='sm'>
                <Text fw={600}>Import Preview</Text>
                <Group gap='xs'>
                  {pendingCount > 0 && (
                    <Badge color='gray' size='sm'>
                      {pendingCount} Pending
                    </Badge>
                  )}
                  {successCount > 0 && (
                    <Badge color='green' size='sm'>
                      {successCount} Success
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge color='red' size='sm'>
                      {errorCount} Errors
                    </Badge>
                  )}
                </Group>
              </Group>

              {importData.length > 1000 && (
                <Alert
                  icon={<IconAlertCircle size='1rem' />}
                  color='yellow'
                  mb='md'
                >
                  <Text size='sm'>
                    <strong>Large dataset detected:</strong> {importData.length}{' '}
                    records will be processed in batches of {BATCH_SIZE}. This
                    may take several minutes to complete.
                  </Text>
                </Alert>
              )}

              <ScrollArea h={300}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Student No.</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Bank Name</Table.Th>
                      <Table.Th>Account Number</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {importData.map((row, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          {row.status === 'success' && (
                            <ActionIcon color='green' size='sm' variant='light'>
                              <IconCheck size='0.8rem' />
                            </ActionIcon>
                          )}
                          {row.status === 'error' && (
                            <ActionIcon color='red' size='sm' variant='light'>
                              <IconX size='0.8rem' />
                            </ActionIcon>
                          )}
                          {row.status === 'pending' && (
                            <Badge color='gray' size='xs'>
                              Pending
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{row.stdNo}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{row.name}</Text>
                          {row.error && (
                            <Text size='xs' c='red'>
                              {row.error}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{row.bankName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{row.accountNumber}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          )}

          <Group justify='flex-end' gap='sm'>
            <Button
              variant='light'
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processImport}
              disabled={importData.length === 0 || isProcessing}
              loading={isProcessing}
            >
              Import {importData.length} Records
              {importData.length > BATCH_SIZE && (
                <Text size='xs' ml='xs' c='dimmed'>
                  (in batches of {BATCH_SIZE})
                </Text>
              )}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
