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
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const oauth2Client = await getAuthenticatedClient()
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.get(
      {
        fileId: id,
        alt: 'media',
      },
      { responseType: 'stream' },
    )

    const stream = new ReadableStream({
      start(controller) {
        response.data.on('data', (chunk) => controller.enqueue(chunk))
        response.data.on('end', () => controller.close())
        response.data.on('error', (err) => controller.error(err))
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': response.headers['content-type'],
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    )
  }
}
