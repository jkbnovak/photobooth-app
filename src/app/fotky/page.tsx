'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const observer = useRef<IntersectionObserver>()

  const fetchPhotos = async (page: number) => {
    try {
      const response = await axios.get(`/api/photos?page=${page}&limit=10`)
      console.log('Fetched photos:', response.data)
      if (response.data.length > 0) {
        setPhotos((prevPhotos) => [...prevPhotos, ...response.data])
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('Failed to fetch photos. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos(page)
  }, [page])

  const lastPhotoElementRef = useCallback(
    (node) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

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

  if (loading && photos.length === 0) {
    return <div>Načítám...</div>
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
            {photos.flatMap((photoSet, photoIndex) =>
              photoSet.photoUrls.map((url, index) => {
                const isLastPhoto =
                  photoIndex === photos.length - 1 &&
                  index === photoSet.photoUrls.length - 1
                return (
                  <div
                    key={`${photoSet._id}-${index}`}
                    className="fotky-photo-slide"
                    ref={isLastPhoto ? lastPhotoElementRef : null}
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
                )
              }),
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
