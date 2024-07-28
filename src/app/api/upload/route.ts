import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import clientPromise from '@/lib/mongodb'
import { PassThrough } from 'stream'

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

function bufferToStream(buffer) {
  const stream = new PassThrough()
  stream.end(buffer)
  return stream
}

export async function POST(request: NextRequest) {
  const { photos, comment } = await request.json()

  try {
    const client = await clientPromise
    const db = client.db('photobooth')
    const collection = db.collection('photos')

    const oauth2Client = await getAuthenticatedClient()
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const photoIds: string[] = []

    for (const photo of photos) {
      const buffer = Buffer.from(photo.split(',')[1], 'base64')

      const fileMetadata = {
        name: `photo_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      }

      const media = {
        mimeType: 'image/jpeg',
        body: bufferToStream(buffer),
      }

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      })

      const photoId = response.data.id

      await drive.permissions.create({
        fileId: photoId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      photoIds.push(photoId)
    }

    await collection.insertOne({
      photoIds,
      comment,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: 'Photos and comment saved', photoIds })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Failed to save photos and comment' },
      { status: 500 },
    )
  }
}
