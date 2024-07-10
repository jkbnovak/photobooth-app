import React, { useState } from 'react'

const PhotoInput: React.FC<{ onFilesSelected: (files: FileList) => void }> = ({ onFilesSelected }) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFilesSelected(files)
      const images: string[] = []
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          images.push(reader.result as string)
          if (images.length === files.length) {
            setSelectedImages(images)
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
      />
      {selectedImages.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Selected ${index}`}
          style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}
        />
      ))}
    </div>
  )
}

export default PhotoInput
