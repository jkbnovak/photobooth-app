'use client'

import { useState } from 'react'
import Head from 'next/head'
import styles from './page.module.css'
import PhotoInput from './components/PhotoInput'
import { FaTimesCircle, FaPaperPlane } from 'react-icons/fa'

const Home = () => {
  const [photos, setPhotos] = useState<string[]>([])
  const [comment, setComment] = useState<string>('')
  const [showOverlay, setShowOverlay] = useState<boolean>(false)
  const [showFullImage, setShowFullImage] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false)

  const handleFilesSelected = (selectedFiles: FileList) => {
    const filesArray = Array.from(selectedFiles)
    setFiles((prevFiles) => [...prevFiles, ...filesArray])
    const images: string[] = []
    filesArray.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        images.push(reader.result as string)
        if (images.length === filesArray.length) {
          setPhotos((prevPhotos) => [...prevPhotos, ...images])
          setShowOverlay(true)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index))
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const submitPhotos = async () => {
    if (files.length > 0) {
      setLoading(true)
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

      setLoading(false)

      if (response.ok) {
        alert('Fotky a komentář byly úspěšně odeslány!')
        setPhotos([])
        setComment('')
        setShowOverlay(false)
        setFiles([])
      } else {
        alert('Nepodařilo se odeslat fotky a komentář.')
      }
    }
  }

  const handlePhotoClick = (photo: string) => {
    setShowFullImage(photo)
  }

  const closeFullImage = () => {
    setShowFullImage(null)
  }

  const openHowItWorksModal = () => {
    setShowHowItWorks(true)
  }

  const closeHowItWorksModal = () => {
    setShowHowItWorks(false)
  }

  return (
    <div className={styles.container}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <h1 className={styles.title}>Fotokoutek</h1>
      <h3 className={styles.title}>#svatbahrdinu</h3>
      <div className={styles.camera}>
        <PhotoInput
          onFilesSelected={handleFilesSelected}
          openHowItWorksModal={openHowItWorksModal}
        />
      </div>
      {showOverlay && photos.length > 0 && (
        <div className={styles.overlay}>
          <h1 className={styles.title}>Fotokoutek</h1>
          <h3 className={styles.title}>#svatbahrdinu</h3>
          <div className={styles.photoContainer}>
            {photos.map((photo, index) => (
              <div key={index} className={styles.photoWrapper}>
                <img
                  src={photo}
                  alt={`Zachyceno ${index}`}
                  className={styles.photo}
                  onClick={() => handlePhotoClick(photo)}
                />
                <button
                  className={styles.removeButton}
                  onClick={() => removePhoto(index)}
                >
                  <FaTimesCircle />
                </button>
              </div>
            ))}
          </div>
          <PhotoInput onFilesSelected={handleFilesSelected} isModal={true} />
          <div className={styles.actions}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Přidejte komentář"
              className={styles.textarea}
            />
            <div className={styles.submitButtonContainer}>
              <button onClick={submitPhotos} className={styles.submitButton}>
                <FaPaperPlane className={styles.icon} />
              </button>
              <span className={styles.submitButtonLabel}>Odeslat</span>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loader}>Odesílání...</div>
        </div>
      )}
      {showFullImage && (
        <div className={styles.fullImageOverlay} onClick={closeFullImage}>
          <img
            src={showFullImage}
            alt="Plná velikost"
            className={styles.fullImage}
          />
        </div>
      )}
      {showHowItWorks && (
        <div
          className={styles.howItWorksOverlay}
          onClick={closeHowItWorksModal}
        >
          <div className={styles.howItWorksContent}>
            <h1 className={styles.title}>How does it work?</h1>
            <p className={styles.howItWorksText}>
              Tato aplikace vám umožňuje pořizovat fotografie, přidávat
              komentáře a nahrávat je. Jednoduše klikněte na ikonu fotoaparátu
              pro pořízení fotografie nebo na ikonu nahrávání pro výběr
              fotografií z vašeho zařízení. Po výběru fotografií můžete přidat
              komentář a poté stisknout tlačítko odeslat pro nahrání všeho.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
