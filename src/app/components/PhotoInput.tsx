import React from 'react'
import { FaCamera, FaUpload } from 'react-icons/fa'
import styles from '../page.module.css'

interface PhotoInputProps {
  onFilesSelected: (files: FileList) => void
}

const PhotoInput: React.FC<PhotoInputProps> = ({ onFilesSelected }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFilesSelected(files)
    }
  }

  return (
    <div className={styles.buttonContainer}>
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
      <button
        onClick={() => document.getElementById('cameraInput')?.click()}
        className={styles.iconButton}
      >
        <FaCamera className={styles.icon} />
      </button>
      <span className={styles.buttonLabel}>Vyfotit</span>
      <button
        onClick={() => document.getElementById('fileInput')?.click()}
        className={styles.iconButton}
      >
        <FaUpload className={styles.icon} />
      </button>
      <span className={styles.buttonLabel}>Nahrát z telefonu</span>
    </div>
  )
}

export default PhotoInput
