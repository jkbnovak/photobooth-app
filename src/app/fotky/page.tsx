"use client"

import { useEffect, useState } from 'react'
import axios from 'axios'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

interface PhotoData {
  _id: string
  photoUrls: string[]
  comment: string
  createdAt: string
}

const FotkyPage = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get('/api/photos?n=10')
        console.log('Fetched photos:', response.data)
        setPhotos(response.data)
      } catch (err) {
        console.error('Failed to fetch photos:', err)
        setError('Failed to fetch photos. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div>
      <h1>Fotky</h1>
      {photos.length > 0 ? (
        <Slider {...settings}>
          {photos.map(photoSet => (
            <div key={photoSet._id}>
              {photoSet.photoUrls.map((url, index) => (
                <div key={index}>
                  <img 
                    src={url} 
                    alt={`Photo ${index + 1}`} 
                    style={{ width: '100%' }} 
                    onError={(e) => { 
                      console.error('Image failed to load:', e);  // Log the error event object
                      console.error('Failed URL:', e.currentTarget.src);  // Log the failed image URL
                      e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Photo+not+available';  // Replace with placeholder
                    }}
                  />
                </div>
              ))}
              <p>{photoSet.comment}</p>
            </div>
          ))}
        </Slider>
      ) : (
        <p>No photos available.</p>
      )}
    </div>
  )
}

export default FotkyPage
