'use client';

import {
  Box,
  Button,
  FileInput,
  Group,
  Image,
  Modal,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCamera, IconDeviceDesktop, IconPhoto } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';

type PhotoSelectionProps = {
  selectedPhoto: File | null;
  photoPreview: string | null;
  onPhotoChange: (file: File | null, preview: string | null) => void;
};

export default function PhotoSelection({
  selectedPhoto,
  photoPreview,
  onPhotoChange,
}: PhotoSelectionProps) {
  const [cameraOpened, { open: openCamera, close: closeCamera }] =
    useDisclosure(false);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onPhotoChange(file, preview);
      };
      reader.readAsDataURL(file);
    } else {
      onPhotoChange(null, null);
    }
  };

  const handleCameraCapture = (capturedFile: File, preview: string) => {
    onPhotoChange(capturedFile, preview);
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
        />

        <Button
          variant='light'
          leftSection={<IconCamera size={16} />}
          onClick={openCamera}
          fullWidth
        >
          Capture with Camera
        </Button>

        {photoPreview && (
          <Box>
            <Text size='sm' mb='xs'>
              Preview:
            </Text>
            <Group>
              <Image
                src={photoPreview}
                alt='Student photo preview'
                w={150}
                h={200}
                fit='cover'
                radius='md'
              />
              <Button
                variant='subtle'
                color='red'
                size='xs'
                onClick={() => onPhotoChange(null, null)}
              >
                Remove Photo
              </Button>
            </Group>
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

function CameraModal({ opened, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const startCamera = useCallback(async () => {
    if (cameraInitialized || isLoading) return;

    setIsLoading(true);
    setError(null);
    setCameraInitialized(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      setStream(mediaStream);

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
  }, [cameraInitialized, isLoading]);

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
                Click "Start Camera" to begin
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

        <Group justify='space-between'>
          <Button
            variant='subtle'
            leftSection={<IconDeviceDesktop size={16} />}
            onClick={startCamera}
            loading={isLoading}
            disabled={!!stream}
          >
            {stream ? 'Camera Active' : 'Start Camera'}
          </Button>

          <Group>
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
        </Group>
      </Stack>
    </Modal>
  );
}
