# Database Seeding Guide

This guide explains how to populate your Firebase Firestore database with realistic dummy data for testing the application.

## Prerequisites

1. **Firebase Admin SDK** - Already configured in your project
2. **Service Account Key** - Download from Firebase Console:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in the project root

3. **Node.js installed** on your system

## What Gets Seeded

The seeding script creates the following data:

### 1. **User Statistics Updates**
- **Patient**: 2 appointments, 1 upcoming, 1 completed, 3 groups joined
- **Doctor**: 5 patients, 3 upcoming appointments, 12 completed, 24 reviews, $2400 revenue

### 2. **Appointments** (3 total)
- `apt_001`: Doctor-Patient consultation (completed)
- `apt_002`: Doctor-Patient follow-up (upcoming)
- `apt_003`: Doctor-Patient mental health consultation (completed)

### 3. **Chat Conversations** (2 total)
- **Chat 1**: Doctor-Patient conversation about health updates (4 messages)
- **Chat 2**: Doctor-Patient conversation about symptoms and consultation (4 messages)

### 4. **Patient-Doctor Relationships**
- Links patient to doctor with active status

## How to Run

### Option 1: Using npm script (Recommended)

Add this to your `package.json`:

```json
{
  "scripts": {
    "seed:db": "node scripts/seedDatabase.js"
  }
}
```

Then run:
```bash
npm run seed:db
```

### Option 2: Direct Node execution

```bash
node scripts/seedDatabase.js
```

## Expected Output

```
Starting database seeding...

📋 Fetching user UIDs from Firestore...
✓ Found Doctor: doc_user_id_xxxxx
✓ Found Patient: patient_user_id_xxxxx

📊 Updating user statistics...
✓ Updated Patient stats
✓ Updated Doctor stats

📅 Creating appointments...
✓ Created appointment: apt_001
✓ Created appointment: apt_002
✓ Created appointment: apt_003

💬 Creating chat conversations...
✓ Created chat: chat_001
✓ Created chat: chat_002

👥 Creating patient-doctor relationships...
✓ Created patient-doctor relationship

✅ Database seeding completed successfully!

📋 Summary:
   - Doctor ID: doc_user_id_xxxxx
   - Patient ID: patient_user_id_xxxxx
   - Appointments created: 3
   - Chat conversations: 2
   - Messages total: 8
```

## Troubleshooting

### Error: "serviceAccountKey.json not found"
- Ensure the service account key is saved in the project root directory
- Verify the file name is exactly `serviceAccountKey.json`

### Error: "Could not find Doctor or Patient user"
- Make sure the test users are already created in Firebase Auth and Firestore
- Test users needed:
  - Email: `doc@mail.com` (Role: Doctor)
  - Email: `patient@mail.com` (Role: Patient)
  - Email: `admin@mail.com` (Role: Admin)

### Firebase Permissions Error
- Ensure your Firestore security rules allow writes to these collections
- Check that your service account has appropriate permissions in Firebase Console

## Testing the Seeded Data

After running the script:

1. **Log in as Patient** (patient@mail.com / test123)
   - View appointments on home screen
   - Check chat conversations in messages

2. **Log in as Doctor** (doc@mail.com / test123)
   - View patient list
   - See scheduled appointments
   - Check patient conversations

3. **Log in as Admin** (admin@mail.com / test123)
   - View dashboard with stats
   - Browse people tab to see patient-doctor relationships

## Resetting Data

To start fresh, delete these collections from Firestore:
- `appointments`
- `chats`
- `relationships`

Then run the script again.

## Modifying Seed Data

Edit `scripts/seedDatabase.js` to customize:
- Appointment dates and times
- Chat messages
- User statistics
- Add more appointments or conversations

Update the arrays at the top of the file:
- `appointmentsData`
- `chatsData`
- `patientStatsUpdate`
- `doctorStatsUpdate`
