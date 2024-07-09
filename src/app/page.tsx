'use client'

import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import styles from './page.module.css'

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')
  const [showOverlay, setShowOverlay] = useState<boolean>(false)

  useEffect(() => {
    startCamera()
  }, [])

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 4096 },
          height: { ideal: 2160 },
        },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const takePhoto = () => {
    if (videoRef.current) {
      const videoWidth = videoRef.current.videoWidth
      const videoHeight = videoRef.current.videoHeight

      const canvas = document.createElement('canvas')
      canvas.width = videoWidth
      canvas.height = videoHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight)
        setPhoto(canvas.toDataURL('image/jpeg'))
        setShowOverlay(true)
      }
    }
  }

  const retakePhoto = () => {
    setPhoto(null)
    setShowOverlay(false)
  }

  const submitPhoto = async () => {
    if (photo && comment) {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo, comment }),
      })

      if (response.ok) {
        alert('Photo and comment submitted successfully!')
        setPhoto(null)
        setComment('')
        setShowOverlay(false)
      } else {
        alert('Failed to submit photo and comment.')
      }
    }
  }

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
        <video ref={videoRef} className={styles.video}></video>
        <button onClick={startCamera} className={styles.button}>
          Start Camera
        </button>
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
  )
}

export default Home
