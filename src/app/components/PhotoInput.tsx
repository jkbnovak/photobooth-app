import React from 'react'
import { FaCamera, FaUpload, FaQuestionCircle } from 'react-icons/fa'
import styles from '../page.module.css'

interface PhotoInputProps {
  onFilesSelected: (files: FileList) => void
  openHowItWorksModal?: () => void
  isModal?: boolean
}

const PhotoInput: React.FC<PhotoInputProps> = ({
  onFilesSelected,
  openHowItWorksModal,
  isModal = false,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFilesSelected(files)
    }
  }

  return (
    <div
      className={isModal ? styles.modalButtonContainer : styles.buttonContainer}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        id="cameraInput"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        id="fileInput"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div className={styles.buttonWrapper}>
        <button
          onClick={() => document.getElementById('cameraInput')?.click()}
          className={isModal ? styles.modalIconButton : styles.iconButton}
        >
          <FaCamera className={isModal ? styles.modalIcon : styles.icon} />
        </button>
        <span
          className={isModal ? styles.modalButtonLabel : styles.buttonLabel}
        >
          Vyfotit fotku
        </span>
      </div>
      <div className={styles.buttonWrapper}>
        <button
          onClick={() => document.getElementById('fileInput')?.click()}
          className={isModal ? styles.modalIconButton : styles.iconButton}
        >
          <FaUpload className={isModal ? styles.modalIcon : styles.icon} />
        </button>
        <span
          className={isModal ? styles.modalButtonLabel : styles.buttonLabel}
        >
          Nahrát z telefonu
        </span>
      </div>
      {!isModal && openHowItWorksModal && (
        <div className={styles.buttonWrapper}>
          <button onClick={openHowItWorksModal} className={styles.iconButton}>
            <FaQuestionCircle className={styles.icon} />
          </button>
          <span className={styles.buttonLabel}>Jak to funguje?</span>
        </div>
      )}
    </div>
  )
}

export default PhotoInput
