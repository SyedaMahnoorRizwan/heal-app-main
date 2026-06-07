# Video Calling Integration - Setup Guide

This project includes video calling functionality using Agora (now Vonage). Follow these steps to integrate your actual credentials:

## Prerequisites

1. Sign up for a [Vonage Video API account](https://tokbox.com/account/user/signup)
2. Create a new project in the Vonage dashboard
3. Get your **API Key** (App ID) and **API Secret**

## Configuration Steps

### 1. Update Environment Variables

1. Copy the `.env.example` file to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and add your Vonage API Key:
   ```
   AGORA_APP_ID=your_actual_agora_app_id_here
   ```
3. The application will automatically use the environment variable instead of the placeholder.

### 2. Security Considerations

For production use, you should implement secure token generation on your backend instead of using the API key directly in the client. The current implementation is suitable for development/testing only.

### 3. Token-based Authentication (Recommended for Production)

For production applications, implement server-side token generation:

1. Create an API endpoint in your backend that generates Vonage tokens
2. Modify the `joinChannel` call in `VideoCallScreen.js` to fetch tokens from your server:
   ```javascript
   // Instead of: await agoraEngine.current.joinChannel(null, channelName, null, uid);
   // Fetch token from your backend:
   const token = await fetchTokenFromServer(channelName, uid);
   await agoraEngine.current.joinChannel(token, channelName, null, uid);
   ```

## Running the Application

After integrating your credentials:

1. Run `npx expo prebuild` to update native configurations
2. Start the development server: `npx expo start`
3. For native builds, you'll need to build using the development client:
   - Android: `npx expo run:android`
   - iOS: `npx expo run:ios`

## Features Implemented

- One-on-one video calls between doctors and patients
- Audio mute/unmute
- Video on/off
- Call joining/leaving
- Remote user video display
- Proper cleanup and resource management

## Troubleshooting

### Common Issues:

1. **Build Errors**: Make sure you're using Expo Dev Client, not Expo Go
2. **Permissions**: Ensure camera and microphone permissions are granted
3. **Network Issues**: Video calls require stable internet connection

### Testing

For initial testing without actual credentials:
- The app will show a configuration error message
- Use the "Go Back" option to return to the previous screen
- Once credentials are added, video calls should work as expected

## Notes

- This implementation uses the native Agora SDK through Expo Dev Client
- The video calling functionality is integrated with the appointment system
- Both doctors and patients can initiate video calls from appointment details
- The UI includes proper controls for call management