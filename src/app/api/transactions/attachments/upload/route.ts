import { NextRequest, NextResponse } from "next/server"
import { saveAttachmentFile } from "@/src/lib/util/fileStorage"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('transactionId');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    const attachmentId = uuidv4();
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save the file to the filesystem
    const filePath = await saveAttachmentFile(transactionId, attachmentId, file.name, buffer);
    
    return NextResponse.json({ 
        id: attachmentId,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' }, 
      { status: 500 }
    );
  }
}
