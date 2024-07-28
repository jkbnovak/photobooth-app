'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './fotky-gallery.css' // Import the new CSS file

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
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 7500,
    beforeChange: (current, next) => resetAnimation(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  const resetAnimation = (index) => {
    const slides = document.getElementsByClassName('fotky-photo-slide')
    if (slides[index]) {
      const images = slides[index].getElementsByClassName('fotky-photo')
      for (let img of Array.from(images)) {
        const htmlImageElement = img as HTMLElement
        htmlImageElement.style.animation = 'none'
        htmlImageElement.offsetHeight // Trigger reflow
        htmlImageElement.style.animation = ''
      }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="fotky-container">
      <h1 className="fotky-title">Fotky</h1>
      {photos.length > 0 ? (
        <div className="carousel-container">
          <Slider {...settings}>
            {photos.flatMap((photoSet) =>
              photoSet.photoUrls.map((url, index) => (
                <div
                  key={`${photoSet._id}-${index}`}
                  className="fotky-photo-slide"
                >
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="fotky-photo"
                    onError={(e) => {
                      console.error('Image failed to load:', e) // Log the error event object
                      console.error('Failed URL:', e.currentTarget.src) // Log the failed image URL
                      e.currentTarget.src =
                        'https://via.placeholder.com/600x400?text=Photo+not+available' // Replace with placeholder
                    }}
                  />
                  <p>{photoSet.comment}</p>
                </div>
              )),
            )}
          </Slider>
        </div>
      ) : (
        <p>No photos available.</p>
      )}
    </div>
  )
}

export default FotkyPage
