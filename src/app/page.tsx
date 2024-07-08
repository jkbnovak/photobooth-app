'use client';

import { useState, useRef } from 'react'

const Home = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [comment, setComment] = useState<string>('')

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    }
  }

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        setPhoto(canvas.toDataURL('image/png'))
      }
    }
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
      } else {
        alert('Failed to submit photo and comment.')
      }
    }
  }

  return (
    <div>
      <h1>Photobooth App</h1>
      <div>
        <video ref={videoRef}></video>
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={takePhoto}>Take Photo</button>
      </div>
      {photo && (
        <div>
          <img src={photo} alt="Captured" />
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment"
          />
          <button onClick={submitPhoto}>Submit</button>
        </div>
      )}
      <a href="/api/auth">
        <button>Authenticate with Google</button>
      </a>
    </div>
  )
}

export default Home
