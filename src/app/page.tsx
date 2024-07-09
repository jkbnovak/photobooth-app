'use client'

import { useState, useRef } from 'react';
import Head from 'next/head';
import { Camera } from 'react-camera-pro'; // Adjusted import statement
import styles from './page.module.css';

const Home = () => {
  const cameraRef = useRef<any>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  console.log(Camera); // Verify that Camera is not undefined

  if (!Camera) {
    console.error('Camera component is not imported correctly.');
    return <div>Error loading Camera component.</div>;
  }

  const takePhoto = () => {
    if (cameraRef.current) {
      const photoData = cameraRef.current.takePhoto();
      setPhoto(photoData);
      setShowOverlay(true);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setShowOverlay(false);
  };

  const submitPhoto = async () => {
    if (photo && comment) {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo, comment }),
      });

      if (response.ok) {
        alert('Photo and comment submitted successfully!');
        setPhoto(null);
        setComment('');
        setShowOverlay(false);
      } else {
        alert('Failed to submit photo and comment.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <h1 className={styles.title}>Photobooth App</h1>
      <div className={styles.camera}>
        <Camera
          ref={cameraRef}
          aspectRatio={16 / 9}
          facingMode="environment"
          errorMessages={{
            noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
            permissionDenied: 'Permission denied. Please allow camera access.',
            switchCamera: 'It is not possible to switch camera to different one because there is only one video device accessible.',
            canvas: 'Canvas is not supported.',
          }}
          numberOfCamerasCallback={(numberOfCameras) => console.log('Number of cameras detected:', numberOfCameras)}
        />
        <button onClick={takePhoto} className={styles.button}>
          Take Photo
        </button>
      </div>
      {showOverlay && photo && (
        <div className={styles.overlay}>
          <div>
            <img src={photo} alt="Captured" />
            <div className={styles.actions}>
              <button onClick={retakePhoto} className={styles.button}>
                Retake Photo
              </button>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment"
                className={styles.input}
              />
              <button onClick={submitPhoto} className={styles.button}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
