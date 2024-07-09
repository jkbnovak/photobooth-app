'use client'

import { useState } from 'react'
import Head from 'next/head'
import styles from './page.module.css'

const Home = () => {
  const [photo, setPhoto] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')
  const [showOverlay, setShowOverlay] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
        setShowOverlay(true)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const retakePhoto = () => {
    setPhoto(null)
    setShowOverlay(false)
  }

  const submitPhoto = async () => {
    if (file && comment) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photo: base64String, comment }),
        })

        if (response.ok) {
          alert('Photo and comment submitted successfully!')
          setPhoto(null)
          setComment('')
          setShowOverlay(false)
          setFile(null)
        } else {
          alert('Failed to submit photo and comment.')
        }
      }
      reader.readAsDataURL(file)
    } else if (photo && comment) {
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
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
      </div>
      {showOverlay && photo && (
        <div className={styles.overlay}>
          <div className={styles.photoContainer}>
            <img src={photo} alt="Captured" className={styles.photo} />
          </div>
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
      )}
    </div>
  )
}

export default Home
