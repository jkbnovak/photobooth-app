import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import clientPromise from '@/lib/mongodb';
import { PassThrough } from 'stream';
import sharp from 'sharp';
import Busboy from 'busboy';

export const GET = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json({ message: 'Use POST method to upload images' });
};

export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { files, fields } = await parseFormData(req);
    const comment = fields.comment || '';
    const oauth2Client = await getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const webFolderId = await getOrCreateWebFolder(drive);

    const photoIds: string[] = [];
    const reducedPhotoIds: string[] = [];

    for (const file of files) {
      try {
        const buffer = file.buffer;

        const originalFileMetadata = {
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        };

        const originalResponse = await drive.files.create({
          requestBody: originalFileMetadata,
          media: {
            mimeType: 'image/jpeg',
            body: bufferToStream(buffer).pipe(sharp().rotate()),
          },
          fields: 'id',
        });

        const originalPhotoId = originalResponse.data.id;

        await drive.permissions.create({
          fileId: originalPhotoId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        photoIds.push(originalPhotoId);

        // Get image metadata to determine aspect ratio
        const metadata = await sharp(buffer).metadata();
        const { width, height } = metadata;

        let resizeOptions;
        if (width > height) {
          // Horizontal photo
          resizeOptions = { height: 800 };
        } else {
          // Vertical or square photo
          resizeOptions = { width: 800 };
        }

        // Create reduced photo with corrected orientation and maintained aspect ratio
        const reducedFileMetadata = {
          name: `photo_reduced_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          parents: [webFolderId], // Store in "web" folder
        };

        const reducedResponse = await drive.files.create({
          requestBody: reducedFileMetadata,
          media: {
            mimeType: 'image/jpeg',
            body: bufferToStream(buffer).pipe(sharp().resize(resizeOptions)),
          },
          fields: 'id',
        });

        const reducedPhotoId = reducedResponse.data.id;

        await drive.permissions.create({
          fileId: reducedPhotoId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        reducedPhotoIds.push(reducedPhotoId);
      } catch (error) {
        console.error('Error processing file stream with sharp:', error);
      }
    }

    const client = await clientPromise;
    const db = client.db('photobooth');
    const collection = db.collection('photos');

    await collection.insertOne({
      photoIds,
      reducedPhotoIds,
      comment,
      createdAt: new Date(),
    });

    console.log('Successfully inserted photo IDs into photos collection');

    res.status(200).json({
      message: 'Photos and comment saved',
      photoIds,
      reducedPhotoIds,
    });
  } catch (e) {
    console.error('Error occurred:', e);
    res.status(500).json({ error: 'Failed to save photos and comment' });
  }
};

function bufferToStream(buffer: Buffer) {
  const stream = new PassThrough();
  stream.end(buffer);
  return stream;
}

function parseFormData(req: NextApiRequest): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const result: ParsedFormData = {
      files: [],
      fields: {},
    };

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const fileBuffer: Buffer[] = [];
      file.on('data', (data) => {
        fileBuffer.push(data);
      });
      file.on('end', () => {
        result.files.push({
          fieldname,
          originalname: filename,
          encoding,
          mimetype,
          buffer: Buffer.concat(fileBuffer),
        });
      });
    });

    busboy.on('field', (fieldname, val) => {
      result.fields[fieldname] = val;
    });

    busboy.on('finish', () => {
      resolve(result);
    });

    busboy.on('error', (err) => {
      reject(err);
    });

    req.pipe(busboy);
  });
}

async function getAuthenticatedClient() {
  const client = await clientPromise;
  const db = client.db('photobooth');
  const collection = db.collection('users');

  const user = await collection.findOne({ userId: 'default_user' });

  if (!user) {
    throw new Error('User not authenticated');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.expiryDate,
  });

  if (Date.now() >= user.expiryDate) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await collection.updateOne(
      { userId: 'default_user' },
      {
        $set: {
          accessToken: credentials.access_token,
          expiryDate: credentials.expiry_date,
        },
      },
    );
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

async function getOrCreateWebFolder(drive: any) {
  const folderName = 'web';
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  let folder = response.data.files.find((file: any) => file.name === folderName);

  if (!folder) {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    const folderResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });
    folder = folderResponse.data;
  }

  return folder.id;
}
