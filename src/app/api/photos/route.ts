import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { google } from 'googleapis'

async function getAuthenticatedClient() {
  const client = await clientPromise
  const db = client.db('photobooth')
  const collection = db.collection('users')

  const user = await collection.findOne({ userId: 'default_user' })

  if (!user) {
    throw new Error('User not authenticated')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.expiryDate,
  })

  if (Date.now() >= user.expiryDate) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await collection.updateOne(
      { userId: 'default_user' },
      {
        $set: {
          accessToken: credentials.access_token,
          expiryDate: credentials.expiry_date,
        },
      },
    )
    oauth2Client.setCredentials(credentials)
  }

  return oauth2Client
}

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('photobooth')
    const collection = db.collection('photos')

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    // Fetch photos from the last 30 minutes
    let recentPhotos = await collection
      .find({ createdAt: { $gte: thirtyMinutesAgo } })
      .sort({ createdAt: -1 })
      .toArray()

    // If fewer than 10 photos, fetch the latest 10 photos
    if (recentPhotos.length < 10) {
      const additionalPhotos = await collection
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

      // Combine and sort to get the latest 10 photos
      recentPhotos = Array.from(new Set([...recentPhotos, ...additionalPhotos]))
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
    }

    const oauth2Client = await getAuthenticatedClient()
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    for (const photo of recentPhotos) {
      const urls = photo.reducedPhotoIds.map((id) => `/api/proxy?id=${id}`)
      photo.photoUrls = urls
    }

    return NextResponse.json(recentPhotos)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Failed to fetch photos and comments' },
      { status: 500 },
    )
  }
}
