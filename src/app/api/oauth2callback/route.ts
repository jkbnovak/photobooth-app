import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const client = await clientPromise
    const db = client.db('photobooth')
    const collection = db.collection('users') // Use a collection to store user tokens

    // For simplicity, let's assume a single user for now.
    // In a real application, you should handle multiple users.
    await collection.updateOne(
      { userId: 'default_user' },
      {
        $set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
        },
      },
      { upsert: true },
    )

    // Use an absolute URL for redirection
    const absoluteUrl = new URL('/', req.url).toString()
    return NextResponse.redirect(absoluteUrl)
  } catch (error) {
    console.error('Error retrieving tokens:', error)
    return NextResponse.json(
      { error: 'Failed to get token', details: error.message },
      { status: 500 },
    )
  }
}
