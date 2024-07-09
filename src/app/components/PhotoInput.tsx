import React, { useState } from 'react'

const PhotoInput: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<
    string | ArrayBuffer | null
  >(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />
      {selectedImage && (
        <img
          src={selectedImage as string}
          alt="Selected"
          style={{ width: '100%', maxWidth: '300px', marginTop: '10px' }}
        />
      )}
    </div>
  )
}

export default PhotoInput
