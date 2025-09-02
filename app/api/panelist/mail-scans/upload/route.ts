import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

// Validation schema for file uploads
const uploadFileSchema = z.object({
  mail_package_id: z.string().uuid("Invalid mail package ID format"),
  document_type: z.enum(["scan", "ocr_text", "supporting_document", "metadata"]),
  image_sequence: z.number().min(1).optional(), // only for scans
  file_data: z.string().min(1, "File data is required"),
  filename: z.string().min(1, "Filename is required"),
  mime_type: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth("upload_mail_scans")
    const body = await request.json()

    // Validate request body
    const validation = uploadFileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { 
      mail_package_id, 
      document_type, 
      image_sequence, 
      file_data, 
      filename, 
      mime_type,
      metadata 
    } = validation.data

    // Validate image_sequence is provided for scans
    if (document_type === "scan" && !image_sequence) {
      return NextResponse.json(
        { error: "image_sequence is required for scan uploads" },
        { status: 400 }
      )
    }

    // Get panelist profile ID
    const { data: profile, error: profileError } = await supabase
      .from("panelist_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Panelist profile not found" }, { status: 404 })
    }

    // Verify the mail package exists and belongs to this panelist
    const { data: mailPackage, error: packageError } = await supabase
      .from("mail_packages")
      .select("id, panelist_id")
      .eq("id", mail_package_id)
      .eq("panelist_id", profile.id)
      .single()

    if (packageError || !mailPackage) {
      return NextResponse.json({ error: "Mail package not found or access denied" }, { status: 404 })
    }

    // Generate unique S3 key
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const s3Key = `${timestamp}_${filename}`

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file_data, "base64")
    const fileSizeBytes = fileBuffer.length

    try {
      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mime_type || "application/octet-stream",
        Metadata: {
          uploaded_by: user.id,
          mail_package_id: mail_package_id,
          document_type: document_type
        }
      })

      await s3Client.send(uploadCommand)

      let result: any = {}
      let uploadType: string = ""

      if (document_type === "scan") {
        // Create mail_scan record
        const { data: scan, error: scanError } = await supabase
          .from("mail_scans")
          .insert({
            panelist_id: profile.id,
            mailpack_id: mail_package_id,
            image_filename: filename,
            s3_bucket_name: process.env.S3_BUCKET_NAME!,
            s3_key: s3Key,
            file_size_bytes: fileSizeBytes,
            image_sequence: image_sequence!,
            scan_status: "uploaded"
          })
          .select(`
            id,
            panelist_id,
            mailpack_id,
            image_filename,
            s3_bucket_name,
            s3_key,
            image_sequence,
            scan_status,
            scan_date,
            created_at
          `)
          .single()

        if (scanError) {
          return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 })
        }

        result = { scan }
        uploadType = "scan"

      } else {
        // Create mail_package_documents record
        const { data: document, error: documentError } = await supabase
          .from("mail_package_documents")
          .insert({
            mail_package_id: mail_package_id,
            document_type: document_type,
            s3_key: s3Key,
            filename: filename,
            file_size_bytes: fileSizeBytes,
            mime_type: mime_type || "application/octet-stream"
          })
          .select(`
            id,
            mail_package_id,
            document_type,
            s3_key,
            filename,
            file_size_bytes,
            mime_type,
            uploaded_at,
            created_at
          `)
          .single()

        if (documentError) {
          return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
        }

        result = { document }
        uploadType = "document"
      }

      return NextResponse.json({
        success: true,
        upload_type: uploadType,
        ...result,
        message: "File uploaded successfully"
      }, { status: 201 })

    } catch (s3Error) {
      return NextResponse.json({ error: "Failed to upload file to S3" }, { status: 500 })
    }

  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
