**HEAL App - Setup & Run Guide**

Prerequisites

Before running the project, make sure you have installed:

Node.js (LTS Version)
npm
Android Studio
Android SDK
Expo CLI
Git

**Clone the Repository**
git clone <repository-url>
cd heal-app
Install Dependencies
npm install

**Configure Environment Variables**

Create a .env file in the project root and add:

AGORA_APP_ID=your_agora_app_id
AGORA_CERTIFICATE=your_agora_certificate

Add any additional Firebase or Stripe keys required by the project.

Start the Expo Development Server
npx expo start
Run on Android Emulator
Open Android Studio.
Start an Android Virtual Device (AVD).
Run:
npx expo run:android
Run on Physical Android Device
Enable Developer Options
Open Settings > About Phone.
Tap Build Number 7 times.
Enable Developer Options.
Turn on USB Debugging.
Verify Device Connection
Connect the device via USB and run:

adb devices

You should see your device listed.

Example:
List of devices attached
RZ8N12345ABC    device
Run the App
npx expo run:android --device
Common Issues
Device Not Detected

Check:

adb devices

If no device appears:

adb kill-server
adb start-server
adb devices

Accept the USB debugging prompt on your phone.

Clear Expo Cache
npx expo start --clear
Reinstall Dependencies
rm -rf node_modules
npm install

Windows:

rmdir /s node_modules
npm install
Tech Stack
React Native
Expo
Firebase
Stripe
Agora SDK
Build APK
eas build --platform android

Make sure you are logged in to Expo:

eas login
