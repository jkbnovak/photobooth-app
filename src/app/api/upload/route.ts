import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import clientPromise from '@/lib/mongodb'
import { PassThrough } from 'stream'
import sharp from 'sharp'

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

async function getOrCreateWebFolder(drive) {
  const folderName = 'web'
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  let folder = response.data.files.find((file) => file.name === folderName)

  if (!folder) {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }
    const folderResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    })
    folder = folderResponse.data
  }

  return folder.id
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

    const webFolderId = await getOrCreateWebFolder(drive)

    const photoIds: string[] = []
    const reducedPhotoIds: string[] = []

    for (const photo of photos) {
      const buffer = Buffer.from(photo.split(',')[1], 'base64')

      // Correct orientation and upload original photo
      const originalBuffer = await sharp(buffer).rotate().toBuffer()

      const originalFileMetadata = {
        name: `photo_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      }

      const originalMedia = {
        mimeType: 'image/jpeg',
        body: bufferToStream(originalBuffer),
      }

      const originalResponse = await drive.files.create({
        requestBody: originalFileMetadata,
        media: originalMedia,
        fields: 'id',
      })

      const originalPhotoId = originalResponse.data.id

      await drive.permissions.create({
        fileId: originalPhotoId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      photoIds.push(originalPhotoId)

      // Create reduced photo with corrected orientation
      const reducedBuffer = await sharp(originalBuffer).resize(800).toBuffer()

      const reducedFileMetadata = {
        name: `photo_reduced_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        parents: [webFolderId], // Store in "web" folder
      }

      const reducedMedia = {
        mimeType: 'image/jpeg',
        body: bufferToStream(reducedBuffer),
      }

      const reducedResponse = await drive.files.create({
        requestBody: reducedFileMetadata,
        media: reducedMedia,
        fields: 'id',
      })

      const reducedPhotoId = reducedResponse.data.id

      await drive.permissions.create({
        fileId: reducedPhotoId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      reducedPhotoIds.push(reducedPhotoId)
    }

    // Logging before insertion
    console.log('Inserting original photo IDs:', photoIds)
    console.log('Inserting reduced photo IDs:', reducedPhotoIds)

    await collection.insertOne({
      photoIds,
      reducedPhotoIds,
      comment,
      createdAt: new Date(),
    })

    // Logging after insertion
    console.log('Successfully inserted photo IDs into photos collection')

    return NextResponse.json({
      message: 'Photos and comment saved',
      photoIds,
      reducedPhotoIds,
    })
  } catch (e) {
    console.error('Error occurred:', e)
    return NextResponse.json(
      { error: 'Failed to save photos and comment' },
      { status: 500 },
    )
  }
}
