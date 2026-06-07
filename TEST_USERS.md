# Heal App - Test User Credentials

All test users have password: **test123**

## Admin Account
| Email | Password | Role |
|-------|----------|------|
| admin@mail.com | test123 | Admin |

## Test Doctors (10)

| # | Email | Name | City | Phone |
|---|-------|------|------|-------|
| 1 | doctor1@mail.com | Dr. Muhammad Ali Khan | Lahore | +923001111111 |
| 2 | doctor2@mail.com | Dr. Fatima Ahmad | Karachi | +923002222222 |
| 3 | doctor3@mail.com | Dr. Hassan Raza | Islamabad | +923003333333 |
| 4 | doctor4@mail.com | Dr. Ayesha Malik | Lahore | +923004444444 |
| 5 | doctor5@mail.com | Dr. Ahmed Hassan | Rawalpindi | +923005555555 |
| 6 | doctor6@mail.com | Dr. Zainab Khan | Multan | +923006666666 |
| 7 | doctor7@mail.com | Dr. Imran Sheikh | Peshawar | +923007777777 |
| 8 | doctor8@mail.com | Dr. Saira Ahmed | Faisalabad | +923008888888 |
| 9 | doctor9@mail.com | Dr. Bilal Nasir | Gujranwala | +923009999999 |
| 10 | doctor10@mail.com | Dr. Hina Abbas | Hyderabad | +923001010101 |

## Test Patients (10)

| # | Email | Name | City | Phone |
|---|-------|------|------|-------|
| 1 | patient1@mail.com | Ali Hassan | Lahore | +923011111111 |
| 2 | patient2@mail.com | Amna Khan | Karachi | +923012222222 |
| 3 | patient3@mail.com | Hassan Malik | Islamabad | +923013333333 |
| 4 | patient4@mail.com | Noor Fatima | Lahore | +923014444444 |
| 5 | patient5@mail.com | Muhammad Usman | Rawalpindi | +923015555555 |
| 6 | patient6@mail.com | Zara Ahmed | Multan | +923016666666 |
| 7 | patient7@mail.com | Tariq Khan | Peshawar | +923017777777 |
| 8 | patient8@mail.com | Hira Malik | Faisalabad | +923018888888 |
| 9 | patient9@mail.com | Farhan Ahmed | Gujranwala | +923019999999 |
| 10 | patient10@mail.com | Seema Hassan | Hyderabad | +923020202020 |

## Login Instructions

1. Open app and complete onboarding
2. Click "Log In"
3. Enter email and password (test123)
4. You'll be redirected to respective home screen based on role

### Example Logins:
- **Doctor Login:** doctor1@mail.com / test123 → Doctor Dashboard
- **Patient Login:** patient1@mail.com / test123 → Patient Home
- **Admin Login:** admin@mail.com / test123 → Admin Home

## Features to Test

- ✅ Role-based navigation after login
- ✅ Session persistence (AsyncStorage)
- ✅ Logout functionality on all user types
- ✅ Toast notifications for errors
- ✅ Remember Me checkbox (stores checkbox state)
