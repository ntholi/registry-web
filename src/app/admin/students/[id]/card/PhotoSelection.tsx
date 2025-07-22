'use client';

import {
  ActionIcon,
  Box,
  Button,
  FileInput,
  Group,
  Image,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCamera,
  IconDeviceDesktop,
  IconPhoto,
  IconTrashFilled,
  IconVideo,
} from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadDocument } from '@/lib/storage';
import { checkStudentPhotoExists } from '@/server/students/actions';

type PhotoSelectionProps = {
  selectedPhoto: File | null;
  photoPreview: string | null;
  onPhotoChange: (file: File | null, preview: string | null) => void;
  studentNumber: number;
};

export default function PhotoSelection({
  selectedPhoto,
  photoPreview,
  onPhotoChange,
  studentNumber,
}: PhotoSelectionProps) {
  const [cameraOpened, { open: openCamera, close: closeCamera }] =
    useDisclosure(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  useEffect(() => {
    const loadExistingPhoto = async () => {
      if (!studentNumber) return;

      try {
        setIsLoadingExisting(true);
        const existingPhotoUrl = await checkStudentPhotoExists(studentNumber);

        if (existingPhotoUrl && !photoPreview) {
          onPhotoChange(null, existingPhotoUrl);
        }
      } catch (error) {
        console.error('Error loading existing photo:', error);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadExistingPhoto();
  }, [studentNumber, onPhotoChange, photoPreview]);

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${studentNumber}.${fileExtension}`;

      await uploadDocument(file, fileName);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const preview = e.target?.result as string;
        onPhotoChange(file, preview);
        await uploadPhoto(file);
      };
      reader.readAsDataURL(file);
    } else {
      onPhotoChange(null, null);
    }
  };

  const handleCameraCapture = async (capturedFile: File, preview: string) => {
    onPhotoChange(capturedFile, preview);
    await uploadPhoto(capturedFile);
    closeCamera();
  };

  return (
    <Paper p='lg' shadow='sm' radius='md'>
      <Text size='lg' fw={600} mb='md'>
        Photo Selection
      </Text>

      <Stack gap='md'>
        <FileInput
          label='Select from Device'
          placeholder='Click to select photo'
          accept='image/*'
          leftSection={<IconPhoto size={16} />}
          value={selectedPhoto}
          onChange={handleFileChange}
          disabled={isUploading || isLoadingExisting}
        />

        <Button
          variant='light'
          leftSection={<IconCamera size={16} />}
          onClick={openCamera}
          fullWidth
          disabled={isUploading || isLoadingExisting}
        >
          Capture with Camera
        </Button>

        {isLoadingExisting && (
          <Text size='sm' c='gray'>
            Loading existing photo...
          </Text>
        )}

        {isUploading && (
          <Text size='sm' c='blue'>
            Uploading photo...
          </Text>
        )}

        {photoPreview && (
          <Box>
            <Text size='sm' mb='xs'>
              Preview:
            </Text>
            <Box pos='relative'>
              <Image
                src={photoPreview}
                alt='Student photo preview'
                w='100%'
                h={200}
                fit='cover'
                radius='md'
              />
              <ActionIcon
                variant='light'
                color='red'
                size='xs'
                onClick={() => onPhotoChange(null, null)}
                pos='absolute'
                top={0}
                right={0}
              >
                <IconTrashFilled size={16} />
              </ActionIcon>
            </Box>
          </Box>
        )}
      </Stack>

      <CameraModal
        opened={cameraOpened}
        onClose={closeCamera}
        onCapture={handleCameraCapture}
      />
    </Paper>
  );
}

type CameraModalProps = {
  opened: boolean;
  onClose: () => void;
  onCapture: (file: File, preview: string) => void;
};

type CameraDevice = {
  deviceId: string;
  label: string;
  groupId: string;
};

function CameraModal({ opened, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId,
        }));

      setAvailableCameras(videoDevices);

      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Unable to access camera devices.');
    }
  }, [selectedCameraId]);

  const startCamera = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };

      if (selectedCameraId) {
        videoConstraints.deviceId = { exact: selectedCameraId };
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setCameraInitialized(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setCameraInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCameraId, isLoading, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraInitialized(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'captured-photo.jpg', {
            type: 'image/jpeg',
          });
          const preview = canvas.toDataURL('image/jpeg');
          onCapture(file, preview);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9,
    );
  }, [onCapture, stopCamera]);

  const handleCameraChange = useCallback(
    async (cameraId: string) => {
      setSelectedCameraId(cameraId);
      if (stream) {
        await startCamera();
      }
    },
    [stream, startCamera],
  );

  useEffect(() => {
    if (opened) {
      getAvailableCameras();
    }
  }, [opened, getAvailableCameras]);

  useEffect(() => {
    if (opened && availableCameras.length > 0 && selectedCameraId && !stream) {
      startCamera();
    }
    return () => {
      if (!opened) {
        stopCamera();
      }
    };
  }, [opened, availableCameras.length, selectedCameraId]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title='Capture Photo'
      size='lg'
      centered
    >
      <Stack>
        {error && (
          <Text c='red' size='sm'>
            {error}
          </Text>
        )}

        <Box style={{ position: 'relative' }}>
          {!stream && isLoading && (
            <Box
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c='white' size='sm'>
                Starting camera...
              </Text>
            </Box>
          )}

          {!stream && !isLoading && (
            <Box
              style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#000',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text c='white' size='sm'>
                Camera not available
              </Text>
            </Box>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: '400px',
              backgroundColor: '#000',
              borderRadius: '8px',
              display: stream ? 'block' : 'none',
            }}
          />

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>

        {availableCameras.length > 1 && (
          <Select
            label='Select Camera'
            placeholder='Choose a camera'
            data={availableCameras.map((camera) => ({
              value: camera.deviceId,
              label: camera.label,
            }))}
            value={selectedCameraId}
            onChange={(value) => value && handleCameraChange(value)}
            leftSection={<IconVideo size={16} />}
            mb='md'
          />
        )}

        <Group justify='flex-end'>
          <Button variant='light' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={capturePhoto}
            disabled={!stream}
            leftSection={<IconCamera size={16} />}
          >
            Capture
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
