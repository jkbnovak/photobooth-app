'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './fotky-gallery.css'

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

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/photos?limit=1000`)
      if (response.data.length > 0) {
        setPhotos(response.data)
      } else {
        setError('No photos available.')
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('Failed to fetch photos. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const settings = {
    dots: false,
    infinite: true,
    speed: 2000,
    autoplaySpeed: 10000,
    slidesToShow: 1,
    slidesToScroll: 1,
    cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
    fade: true,
    autoplay: true,
    beforeChange: (current, next) => resetAnimation(next),
    afterChange: (current) => {
      if (
        current ===
        photos.flatMap((photoSet) => photoSet.photoUrls).length - 1
      ) {
        fetchPhotos() // Fetch new photos when the last photo is reached
      }
    },
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

  if (loading && photos.length === 0) {
    return <div>Načítám...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="fotky-container">
      <h1 className="fotky-title">Fotokoutek #svatbahrdinu</h1>
      {photos.length > 0 ? (
        <div className="carousel-container">
          <Slider {...settings}>
            {photos.flatMap((photoSet, photoIndex) =>
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
                      console.error('Image failed to load:', e)
                      console.error('Failed URL:', e.currentTarget.src)
                      e.currentTarget.src =
                        'https://via.placeholder.com/600x400?text=Photo+not+available'
                    }}
                  />
                  <p>{photoSet.comment}</p>
                </div>
              )),
            )}
          </Slider>
        </div>
      ) : (
        <p>Žádné fotky k dispozici.</p>
      )}
    </div>
  )
}

export default FotkyPage
