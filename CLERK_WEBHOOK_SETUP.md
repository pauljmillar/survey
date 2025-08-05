# Clerk Webhook Setup Guide

This guide explains how to set up Clerk webhooks to automatically sync user data to your Supabase PostgreSQL database.

## Overview

When users sign up, sign in, or update their profiles in Clerk, we need to keep the corresponding user records in your Supabase database in sync. This is handled by a webhook endpoint that receives events from Clerk.

## Setup Steps

### 1. Create the Webhook Endpoint

The webhook endpoint is already created at `/api/webhooks/clerk/route.ts`. This endpoint:

- ✅ Verifies webhook signatures for security
- ✅ Handles `user.created`, `user.updated`, and `user.deleted` events
- ✅ Syncs user data to the `users` table in Supabase
- ✅ Includes proper error handling and logging

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
CLERK_WEBHOOK_SECRET=your_webhook_secret_from_clerk_dashboard
```

### 3. Set Up Clerk Webhook

1. **Go to Clerk Dashboard**:
   - Navigate to your Clerk dashboard
   - Go to "Webhooks" in the sidebar

2. **Create New Webhook**:
   - Click "Add endpoint"
   - Set the endpoint URL to: `https://your-domain.com/api/webhooks/clerk`
   - For local development: `http://localhost:3000/api/webhooks/clerk` (using ngrok or similar)

3. **Select Events**:
   - ✅ `user.created`
   - ✅ `user.updated` 
   - ✅ `user.deleted`

4. **Copy Webhook Secret**:
   - After creating the webhook, copy the signing secret
   - Add it to your `.env.local` as `CLERK_WEBHOOK_SECRET`

### 4. Test the Webhook

1. **Create a test user** in Clerk
2. **Check your application logs** for webhook events
3. **Verify the user was created** in your Supabase database

## How It Works

### User Creation Flow

1. User signs up in Clerk
2. Clerk sends `user.created` webhook to your endpoint
3. Your endpoint verifies the webhook signature
4. User data is inserted into Supabase `users` table
5. User can now access your application with full profile data

### User Update Flow

1. User updates profile in Clerk
2. Clerk sends `user.updated` webhook
3. Your endpoint updates the user record in Supabase
4. Changes are reflected immediately in your app

### User Deletion Flow

1. User account is deleted in Clerk
2. Clerk sends `user.deleted` webhook
3. Your endpoint removes the user from Supabase
4. User data is cleaned up from your database

## Data Mapping

The webhook maps Clerk user data to your Supabase schema:

```typescript
// Clerk User Data
{
  id: "user_123",
  email_addresses: [{ email_address: "user@example.com", id: "email_123" }],
  first_name: "John",
  last_name: "Doe",
  image_url: "https://...",
  created_at: "2024-01-01T00:00:00Z"
}

// Supabase users table
{
  id: "user_123",
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe", 
  avatar_url: "https://...",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

## Security Features

- **Signature Verification**: Uses Svix to verify webhook authenticity
- **Error Handling**: Comprehensive error handling and logging
- **Idempotency**: Safe to retry failed webhooks
- **Validation**: Validates required headers and payload structure

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check endpoint URL is correct
   - Verify webhook is enabled in Clerk dashboard
   - Check server logs for errors

2. **Database errors**:
   - Verify Supabase connection
   - Check `users` table schema matches
   - Ensure service role key has proper permissions

3. **Signature verification fails**:
   - Verify `CLERK_WEBHOOK_SECRET` is correct
   - Check webhook secret in Clerk dashboard
   - Ensure environment variable is loaded

### Debugging

Add these logs to troubleshoot:

```typescript
console.log('Webhook payload:', JSON.stringify(evt.data, null, 2))
console.log('Event type:', evt.type)
console.log('User ID:', evt.data.id)
```

## Next Steps

After setting up the webhook:

1. **Test user registration** - Create a new user and verify they appear in Supabase
2. **Test profile updates** - Update user profile in Clerk and verify changes sync
3. **Monitor webhook events** - Check logs for successful webhook processing
4. **Set up monitoring** - Consider adding webhook health checks

## Production Considerations

- **HTTPS Required**: Webhook endpoint must be HTTPS in production
- **Rate Limiting**: Consider adding rate limiting to prevent abuse
- **Monitoring**: Set up alerts for webhook failures
- **Backup Strategy**: Consider manual sync for critical user data
- **Error Recovery**: Implement retry logic for failed webhook events 