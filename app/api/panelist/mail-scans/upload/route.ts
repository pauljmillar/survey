import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// Validate environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
}

console.log("🔧 Environment variables check:", {
  hasSupabaseUrl: !!requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseKey: !!requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  hasS3Region: !!requiredEnvVars.S3_REGION,
  hasS3AccessKey: !!requiredEnvVars.S3_ACCESS_KEY_ID,
  hasS3SecretKey: !!requiredEnvVars.S3_SECRET_ACCESS_KEY,
  hasS3Bucket: !!requiredEnvVars.S3_BUCKET_NAME
})

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingEnvVars.length > 0) {
  console.error("❌ Missing environment variables:", missingEnvVars)
}

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
  mail_package_id: z.string().uuid("Invalid mail package ID format").nullable().optional(),
  document_type: z.enum(["scan", "ocr_text", "supporting_document", "metadata"]),
  image_sequence: z.number().min(1).optional(), // only for scans
  file_data: z.string().min(1, "File data is required"),
  filename: z.string().min(1, "Filename is required"),
  mime_type: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  console.log("🚀 Upload API called - Starting request processing")
  
  try {
    // Check environment variables first
    if (missingEnvVars.length > 0) {
      console.error("❌ Missing required environment variables:", missingEnvVars)
      return NextResponse.json({ 
        error: "Server configuration error", 
        details: `Missing environment variables: ${missingEnvVars.join(', ')}` 
      }, { status: 500 })
    }
    
    console.log("🔐 Authenticating user...")
    const user = await requireAuth("upload_mail_scans")
    console.log("✅ User authenticated:", { userId: user.id })
    
    console.log("📥 Parsing request body...")
    const body = await request.json()
    console.log("📋 Request body received:", {
      hasMailPackageId: !!body.mail_package_id,
      mailPackageId: body.mail_package_id,
      documentType: body.document_type,
      hasFileData: !!body.file_data,
      fileDataLength: body.file_data?.length || 0,
      filename: body.filename,
      imageSequence: body.image_sequence,
      mimeType: body.mime_type
    })

    // Validate request body
    console.log("✅ Validating request schema...")
    const validation = uploadFileSchema.safeParse(body)
    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.flatten())
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }
    console.log("✅ Request validation passed")

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
      console.error("❌ Missing image_sequence for scan")
      return NextResponse.json(
        { error: "image_sequence is required for scan uploads" },
        { status: 400 }
      )
    }

    // Get panelist profile ID
    console.log("👤 Fetching panelist profile for user:", user.id)
    let profile: any
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("panelist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !profileData) {
        console.error("❌ Panelist profile error:", profileError)
        return NextResponse.json({ error: "Panelist profile not found" }, { status: 404 })
      }
      profile = profileData
      console.log("✅ Panelist profile found:", { profileId: profile.id })
    } catch (profileError) {
      console.error("❌ Unexpected error fetching panelist profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch panelist profile" }, { status: 500 })
    }

    let mailPackageId: string
    let mailPackage: any = null
    let fileBuffer: Buffer
    let fileSizeBytes: number

    if (mail_package_id) {
      console.log("📦 Using existing mail package:", mail_package_id)
      try {
        // Use existing mail package - verify it exists and belongs to this panelist
        const { data: existingPackage, error: packageError } = await supabase
          .from("mail_packages")
          .select("id, panelist_id")
          .eq("id", mail_package_id)
          .eq("panelist_id", profile.id)
          .single()

        if (packageError || !existingPackage) {
          console.error("❌ Mail package verification failed:", packageError)
          return NextResponse.json({ error: "Mail package not found or access denied" }, { status: 404 })
        }
        
        mailPackage = existingPackage
        mailPackageId = existingPackage.id
        console.log("✅ Existing mail package verified:", { packageId: mailPackageId })
      } catch (packageError) {
        console.error("❌ Unexpected error verifying mail package:", packageError)
        return NextResponse.json({ error: "Failed to verify mail package" }, { status: 500 })
      }
    } else {
      console.log("🆕 Creating new mail package...")
      try {
        // Create new mail package when mail_package_id is null
        const { data: newPackage, error: createError } = await supabase
          .from("mail_packages")
          .insert({
            panelist_id: profile.id,
            total_images: 1, // Start with 1 image
            status: "incomplete",
            submission_date: new Date().toISOString()
          })
          .select("id, panelist_id")
          .single()

        if (createError || !newPackage) {
          console.error("❌ Failed to create mail package:", createError)
          return NextResponse.json({ error: "Failed to create mail package" }, { status: 500 })
        }

        mailPackage = newPackage
        mailPackageId = newPackage.id
        console.log("✅ New mail package created:", { packageId: mailPackageId })
      } catch (createError) {
        console.error("❌ Unexpected error creating mail package:", createError)
        return NextResponse.json({ error: "Failed to create mail package" }, { status: 500 })
      }
    }

    // Generate unique S3 key
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const s3Key = `${timestamp}_${filename}`
    console.log("🔑 Generated S3 key:", s3Key)

    // Convert base64 to buffer
    console.log("📊 Converting base64 to buffer...")
    try {
      fileBuffer = Buffer.from(file_data, "base64")
      fileSizeBytes = fileBuffer.length
      console.log("✅ File buffer created:", { sizeBytes: fileSizeBytes })
    } catch (bufferError) {
      console.error("❌ Failed to convert base64 to buffer:", bufferError)
      return NextResponse.json({ error: "Invalid file data format" }, { status: 400 })
    }

    try {
      // Upload to S3
      console.log("☁️ Uploading to S3...")
      console.log("🔧 S3 Configuration:", {
        bucket: process.env.S3_BUCKET_NAME,
        region: process.env.S3_REGION,
        hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY
      })
      
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mime_type || "application/octet-stream",
        Metadata: {
          uploaded_by: user.id,
          mail_package_id: mailPackageId,
          document_type: document_type
        }
      })

      await s3Client.send(uploadCommand)
      console.log("✅ S3 upload successful")

      let result: any = {}
      let uploadType: string = ""

      if (document_type === "scan") {
        console.log("📸 Creating mail_scan record...")
        try {
          // Create mail_scan record
          const { data: scan, error: scanError } = await supabase
            .from("mail_scans")
            .insert({
              panelist_id: profile.id,
              mailpack_id: mailPackageId,
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
            console.error("❌ Failed to create scan record:", scanError)
            return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 })
          }

          result = { scan }
          uploadType = "scan"
          console.log("✅ Mail scan record created:", { scanId: scan.id })
        } catch (scanError) {
          console.error("❌ Unexpected error creating scan record:", scanError)
          return NextResponse.json({ error: "Failed to create scan record" }, { status: 500 })
        }

      } else {
        console.log("📄 Creating mail_package_documents record...")
        try {
          // Create mail_package_documents record
          const { data: document, error: documentError } = await supabase
            .from("mail_package_documents")
            .insert({
              mail_package_id: mailPackageId,
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
            console.error("❌ Failed to create document record:", documentError)
            return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
          }

          result = { document }
          uploadType = "document"
          console.log("✅ Mail package document record created:", { documentId: document.id })
        } catch (documentError) {
          console.error("❌ Unexpected error creating document record:", documentError)
          return NextResponse.json({ error: "Failed to create document record" }, { status: 500 })
        }
      }

      // Return response with appropriate information based on whether a new package was created
      const responseData: any = {
        success: true,
        upload_type: uploadType,
        ...result,
        message: "File uploaded successfully"
      }

      // Include mail package info if a new one was created
      if (!mail_package_id) {
        responseData.mail_package = {
          id: mailPackage.id,
          panelist_id: mailPackage.panelist_id,
          status: mailPackage.status,
          total_images: 1,
          submission_date: new Date().toISOString()
        }
        responseData.message = "New mail package created and file uploaded successfully"
      }

      console.log("🎉 Upload completed successfully, returning response")
      return NextResponse.json(responseData, { status: 201 })

    } catch (s3Error) {
      console.error("❌ S3 operation failed:", s3Error)
      return NextResponse.json({ error: "Failed to upload file to S3" }, { status: 500 })
    }

  } catch (error) {
    console.error("💥 Unexpected error in upload API:", error)
    
    if (error instanceof Error && error.message === "Insufficient permissions") {
      console.error("❌ Permission error:", error.message)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    
    // Log the full error details
    console.error("❌ Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
