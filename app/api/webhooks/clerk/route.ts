import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const svix_id = headersList.get('svix-id')
    const svix_timestamp = headersList.get('svix-timestamp')
    const svix_signature = headersList.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
    }

    // Get the body
    const payload = await request.text()
    const body = JSON.parse(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return NextResponse.json({ error: 'Error verifying webhook' }, { status: 400 })
    }

    // Get the ID and type
    const { id } = evt.data
    const eventType = evt.type

    console.log(`Webhook received: ${eventType} for user ${id}`)

    // Handle the webhook
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break
      case 'user.updated':
        await handleUserUpdated(evt.data)
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in webhook handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleUserCreated(userData: any) {
  try {
    const { id, email_addresses, created_at } = userData

    // Get the primary email
    const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id)
    const email = primaryEmail?.email_address

    if (!email) {
      console.error('No primary email found for user:', id)
      throw new Error('No primary email found')
    }

    // Insert user into Supabase with only the fields that exist in the schema
    const { error } = await supabase
      .from('users')
      .insert({
        id: id,
        email: email,
        role: 'panelist', // Default role for new users
        created_at: created_at,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating user in Supabase:', error)
      throw error
    }

    console.log(`User ${id} created in Supabase with email ${email}`)
  } catch (error) {
    console.error('Error in handleUserCreated:', error)
    throw error
  }
}

async function handleUserUpdated(userData: any) {
  try {
    const { id, email_addresses, updated_at } = userData

    // Get the primary email
    const primaryEmail = email_addresses?.find((email: any) => email.id === userData.primary_email_address_id)
    const email = primaryEmail?.email_address

    if (!email) {
      console.error('No primary email found for user:', id)
      throw new Error('No primary email found')
    }

    // Update user in Supabase with only the fields that exist in the schema
    const { error } = await supabase
      .from('users')
      .update({
        email: email,
        updated_at: updated_at || new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating user in Supabase:', error)
      throw error
    }

    console.log(`User ${id} updated in Supabase`)
  } catch (error) {
    console.error('Error in handleUserUpdated:', error)
    throw error
  }
}

async function handleUserDeleted(userData: any) {
  try {
    const { id } = userData

    // Delete user from Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user from Supabase:', error)
      throw error
    }

    console.log(`User ${id} deleted from Supabase`)
  } catch (error) {
    console.error('Error in handleUserDeleted:', error)
    throw error
  }
} 