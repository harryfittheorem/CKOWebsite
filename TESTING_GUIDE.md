# Testing Guide for ClubReady Integration

This guide explains how to test your ClubReady payment integration without processing real charges.

## Test Mode Options

There are **3 ways** to enable test mode:

### Option 1: URL Parameter (Recommended for Quick Testing)
Add `?test` to the end of your checkout URL:
```
http://localhost:5173/checkout-page.html?test
```

### Option 2: Localhost (Automatic)
Test mode is automatically enabled when running on localhost:
```
http://localhost:5173/checkout-page.html
```

### Option 3: Environment Variable
Set the following in your `.env` file:
```
VITE_TEST_MODE=true
```

## What Happens in Test Mode?

When test mode is active:

1. **Yellow Banner** appears at the top of the page saying "TEST MODE - No real charges will be made"
2. **No API calls** are made to ClubReady's payment endpoint
3. **No charges** are processed to the credit card
4. **Console message** shows: "🧪 TEST MODE: Simulating payment without charging card"
5. You're redirected to the thank you page with a test transaction ID

## Test Credit Card Numbers

If you want to test with ClubReady's actual API (not in test mode), use these test card numbers:

### Visa Test Card
```
Card Number: 4111111111111111
Expiration: Any future date (e.g., 12/2026)
CVV: Any 3 digits (e.g., 123)
```

### Mastercard Test Card
```
Card Number: 5555555555554444
Expiration: Any future date (e.g., 12/2026)
CVV: Any 3 digits (e.g., 123)
```

**Note:** These test cards will still make API calls to ClubReady. Check with ClubReady if they charge for test transactions.

## Testing the Complete Flow

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Open Checkout Page in Test Mode
```
http://localhost:5173/checkout-page.html?test
```

### Step 3: Fill in the Form
- Use any name and contact info
- Select any package
- Use any card details (they won't be processed)

### Step 4: Complete Purchase
Click "Complete Purchase" and verify:
- No actual charge is made
- You see the thank you page
- Console shows test mode message

## Free/Complimentary Packages

Your ClubReady account has a free package available:
- **GUEST/COMPLIMENTARY** (Package ID: 301140) - $0.00

You can test with this package even without test mode since it's free.

## Checking Test Results

### View Test Logs
Check the browser console for test mode messages.

### Database Logs
Even in test mode, prospect creation is logged in your Supabase database:
- `prospects` table - Created users
- `payment_logs` table - API call logs (only if not in test mode)

## Switching to Production

To disable test mode for production:

1. **Remove** the `?test` URL parameter
2. **Remove** or set `VITE_TEST_MODE=false` in `.env`
3. **Deploy** to a non-localhost domain

## Troubleshooting

### Test Mode Not Working
- Check the browser console for errors
- Verify the yellow "TEST MODE" banner appears
- Clear browser cache and reload

### Want to Test Real API Calls
- Use the free "GUEST/COMPLIMENTARY" package
- Or remove the `?test` parameter and use test credit cards

## Support

For ClubReady API questions:
- Check ClubReady documentation
- Contact ClubReady support

For integration issues:
- Check browser console for errors
- Review `payment_logs` table in Supabase
- Check edge function logs in Supabase dashboard
