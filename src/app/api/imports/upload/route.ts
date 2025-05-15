import { NextRequest, NextResponse } from 'next/server';
import { saveImportFile } from '@/src/lib/util/fileStorage';

export async function POST(request: NextRequest) {
  try {
    // Get the import ID from the query parameters
    const importId = request.nextUrl.searchParams.get('importId');
    
    if (!importId) {
      return NextResponse.json({ error: 'Import ID is required' }, { status: 400 });
    }
    
    // Get the file content from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Save the file to the filesystem
    const filePath = saveImportFile(importId, fileContent);
    
    // Return the file path
    return NextResponse.json({ filePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' }, 
      { status: 500 }
    );
  }
}