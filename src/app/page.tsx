'use client'

import { useState } from 'react'
import Head from 'next/head'
import styles from './page.module.css'
import PhotoInput from './components/PhotoInput'

const Home = () => {
  const [photos, setPhotos] = useState<string[]>([])
  const [comment, setComment] = useState<string>('')
  const [showOverlay, setShowOverlay] = useState<boolean>(false)
  const [files, setFiles] = useState<File[]>([])

  const handleFilesSelected = (selectedFiles: FileList) => {
    const filesArray = Array.from(selectedFiles)
    setFiles(filesArray)
    const images: string[] = []
    filesArray.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        images.push(reader.result as string)
        if (images.length === filesArray.length) {
          setPhotos(images)
          setShowOverlay(true)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const retakePhotos = () => {
    setPhotos([])
    setShowOverlay(false)
  }

  const submitPhotos = async () => {
    if (files.length > 0 && comment) {
      const photosBase64: string[] = []
      const readers = files.map((file) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            photosBase64.push(reader.result as string)
            resolve()
          }
          reader.readAsDataURL(file)
        })
      })

      await Promise.all(readers)

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photos: photosBase64, comment }),
      })

      if (response.ok) {
        alert('Photos and comment submitted successfully!')
        setPhotos([])
        setComment('')
        setShowOverlay(false)
        setFiles([])
      } else {
        alert('Failed to submit photos and comment.')
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
        <PhotoInput onFilesSelected={handleFilesSelected} />
      </div>
      {showOverlay && photos.length > 0 && (
        <div className={styles.overlay}>
          <div className={styles.photoContainer}>
            {photos.map((photo, index) => (
              <img key={index} src={photo} alt={`Captured ${index}`} className={styles.photo} />
            ))}
          </div>
          <div className={styles.actions}>
            <button onClick={retakePhotos} className={styles.button}>
              Retake Photos
            </button>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment"
              className={styles.input}
            />
            <button onClick={submitPhotos} className={styles.button}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
