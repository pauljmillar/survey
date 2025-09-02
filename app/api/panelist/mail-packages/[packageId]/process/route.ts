import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"
import OpenAI from "openai"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

// Validation schema for processing request
const processRequestSchema = z.object({
  input_text: z.string().min(1, "Input text is required"),
  processing_notes: z.string().optional(),
})

// Hardcoded prompt for OpenAI
const PROCESSING_PROMPT = `You are an expert at analyzing mail and marketing materials. Analyze the following text extracted from mail images and extract key information in JSON format.

Please return a JSON object with the following structure:
{
  "industry": "string - the industry this mail belongs to (e.g., retail, automotive, healthcare, insurance, etc.)",
  "brand_name": "string - the company or brand name sending the mail",
  "recipient": "string - since this text comes from advertisements sent in the mail, who was the addressee? This information should be near a street address, city, state, etc.  It may say CURRENT RESIDENT or equivalent, and if so, set to CURRENT RESIDENT",
  "response_intention": "string - the user's likely response intention (e.g., interested, not_interested, neutral, etc.)",
  "name_check": "string - the name or recipient information if visible",
  "mail_type": "string - type of mail (e.g., postcard, catalog, flyer, envelope, magazine, etc.)",
  "primary_offer": "the main or most important special offer, discount, or promotion mentioned",
  "urgency_level": "string - how urgent the mail appears (e.g., limited_time, standard, etc.)",
  "estimated_value": "string - rough estimate of monetary value if applicable"
}

Analyze the text carefully and extract as much information as possible. If certain fields cannot be determined from the text, use null for those values. Always return valid JSON.`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const user = await requireAuth("upload_mail_scans")
    const { packageId } = await params
    const body = await request.json()

    // Validate request body
    const validation = processRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { input_text, processing_notes } = validation.data

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
      .select("id, panelist_id, status")
      .eq("id", packageId)
      .eq("panelist_id", profile.id)
      .single()

    if (packageError || !mailPackage) {
      return NextResponse.json({ error: "Mail package not found or access denied" }, { status: 404 })
    }

    // Note: Package status check removed - can process packages in any status

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using a cost-effective model
        messages: [
          {
            role: "system",
            content: PROCESSING_PROMPT
          },
          {
            role: "user",
            content: input_text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent, structured output
        max_tokens: 1000
      })

      const aiResponse = completion.choices[0]?.message?.content
      
      if (!aiResponse) {
        return NextResponse.json({ error: "No response from AI processing" }, { status: 500 })
      }

      // Parse the JSON response from OpenAI
      let parsedResponse
      try {
        parsedResponse = JSON.parse(aiResponse)
      } catch (parseError) {
        return NextResponse.json({ 
          error: "Invalid JSON response from AI processing",
          raw_response: aiResponse 
        }, { status: 500 })
      }

      // Create JSON file content with the processed results
      const jsonContent = JSON.stringify(parsedResponse, null, 2)
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const jsonFilename = `${timestamp}_processed.json`
      const jsonS3Key = `${timestamp}_processed.json`
      
      // Upload the JSON file to S3
      try {
        const jsonUploadCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: jsonS3Key,
          Body: jsonContent,
          ContentType: "application/json",
          Metadata: {
            uploaded_by: user.id,
            mail_package_id: packageId,
            document_type: "processed_result",
            processing_timestamp: new Date().toISOString()
          }
        })

        await s3Client.send(jsonUploadCommand)
        console.log("Processed JSON file uploaded to S3 successfully:", jsonS3Key)
      } catch (s3Error) {
        console.error("Failed to upload processed JSON to S3:", s3Error)
        // Continue anyway - the main response is the AI result
      }

      // Store the processing result in mail_package_documents
      const { data: document, error: documentError } = await supabase
        .from("mail_package_documents")
        .insert({
          mail_package_id: packageId,
          document_type: "supporting_document",
          s3_key: `processed_${packageId}_${Date.now()}.json`,
          filename: `ai_processing_result_${Date.now()}.json`,
          mime_type: "application/json",
          file_size_bytes: Buffer.byteLength(aiResponse, "utf8")
        })
        .select(`
          id,
          mail_package_id,
          document_type,
          s3_key,
          filename,
          mime_type,
          uploaded_at,
          created_at
        `)
        .single()

      if (documentError) {
        console.error("Error storing processing result:", documentError)
        // Continue anyway - the main response is the AI result
      }

      // Return the AI processing result
      return NextResponse.json({
        success: true,
        processing_result: parsedResponse,
        document_record: document,
        message: "Mail package processed successfully through AI",
        processing_metadata: {
          model_used: "gpt-4o-mini",
          tokens_used: completion.usage?.total_tokens,
          processing_timestamp: new Date().toISOString()
        }
      })

    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)
      return NextResponse.json({ 
        error: "AI processing failed", 
        details: openaiError instanceof Error ? openaiError.message : "Unknown error"
      }, { status: 500 })
    }

  } catch (error) {
    if (error instanceof Error && error.message === "Insufficient permissions") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }
    console.error("Error in mail package processing API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}