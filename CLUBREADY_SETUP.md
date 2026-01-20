# ClubReady Payment Integration Setup

This document explains how to configure and use the ClubReady payment integration for CKO Kickboxing.

## Overview

The checkout system is fully integrated with ClubReady's API to:
- Create new prospects in ClubReady
- Process package sales directly through ClubReady
- Store transaction records in Supabase for analytics
- Automatically sync customer data between systems

## Setup Instructions

### 1. Configure Environment Variables

Update the `.env` file with your actual ClubReady API credentials:

```env
CLUBREADY_API_KEY=your_actual_clubready_api_key
CLUBREADY_STORE_ID=9078
CLUBREADY_API_URL=https://api.clubready.com/api/v2
```

**Note:** The Store ID is already set to 9078 as specified. Replace `your_actual_clubready_api_key` with your real API key from ClubReady.

### 2. Sync Packages from ClubReady

The database currently has sample packages. To use your actual ClubReady packages:

1. Get your package IDs from ClubReady dashboard
2. Update the `packages` table in Supabase with your real package information:

```sql
-- Example: Update with your real ClubReady package data
UPDATE packages SET
  clubready_package_id = 'YOUR_REAL_PACKAGE_ID',
  name = 'Your Package Name',
  description = 'Package description',
  price = 149.00,
  duration_months = 1
WHERE id = 'package-uuid-here';
```

Or insert new packages:

```sql
INSERT INTO packages (clubready_package_id, name, description, price, duration_months, is_active, display_order)
VALUES ('YOUR_PACKAGE_ID', 'Package Name', 'Description', 149.00, 1, true, 1);
```

## System Architecture

### Database Tables

- **prospects**: Stores customer information synced with ClubReady
- **packages**: Available membership packages from ClubReady
- **transactions**: Payment transaction records
- **payment_logs**: API call logs for debugging

### Edge Functions

Four Supabase Edge Functions handle ClubReady API integration:

1. **clubready-get-packages**: Retrieves available packages for display
2. **clubready-search-prospect**: Searches for existing prospects by email/phone
3. **clubready-create-prospect**: Creates new prospects in ClubReady
4. **clubready-process-payment**: Processes package purchases

All functions are deployed and configured with proper CORS headers.

## Checkout Flow

### Step 1: Contact Information
- Customer enters name, email, phone, and date of birth
- Data is validated before proceeding

### Step 2: Package Selection
- Available packages are loaded from the database
- Customer selects their desired membership package
- Pricing is displayed clearly

### Step 3: Payment
- Customer enters credit card information
- System searches for existing prospect in ClubReady
- If not found, creates new prospect automatically
- Processes payment through ClubReady's payment gateway
- Stores transaction record in database
- Redirects to confirmation page

## Testing

### Test Mode
Before going live, test with ClubReady's sandbox environment:

1. Request sandbox API credentials from ClubReady
2. Update `CLUBREADY_API_URL` to sandbox URL
3. Use test credit card numbers provided by ClubReady
4. Verify prospect creation and payment processing

### Production Checklist

- [ ] Real ClubReady API credentials configured
- [ ] Production API URL set
- [ ] Real package data loaded in database
- [ ] Test complete purchase flow
- [ ] Verify prospect appears in ClubReady
- [ ] Verify payment is recorded correctly
- [ ] Test email confirmations
- [ ] Verify thank you page displays transaction details

## Accessing the Checkout

The checkout page is available at:
- Development: `http://localhost:3000/checkout-page.html`
- Production: `https://yourdomain.com/checkout-page.html`

You can link to it from any page on your site:

```html
<a href="checkout-page.html">Buy Membership</a>
```

## Monitoring

### View Transactions
Check the Supabase dashboard to view all transactions:
- Navigate to Table Editor > transactions
- Filter by status, date, or customer

### API Logs
Debug API issues using the payment_logs table:
- View request/response data
- Check error messages
- Monitor API performance

### ClubReady Dashboard
Verify transactions in ClubReady:
- Check prospect creation
- Verify payment processing
- Review membership activation

## Security

- Credit card data is tokenized and never stored in raw form
- All API calls use HTTPS
- Row Level Security (RLS) enabled on all database tables
- Environment variables protect API keys
- PCI compliance maintained through ClubReady

## Support

For issues with:
- **ClubReady API**: Contact ClubReady support
- **Database/Edge Functions**: Check Supabase logs
- **Payment Processing**: Review payment_logs table

## Sample Packages

The database includes four sample packages:
1. Monthly Unlimited - $149/month
2. 3-Month Membership - $399
3. 6-Month Membership - $749
4. Annual Membership - $1,399

Replace these with your actual ClubReady package IDs and pricing.

## Important Notes

- Store ID is set to 9078 as specified
- New prospects are automatically created in ClubReady
- All transactions are logged for audit purposes
- Payment data is synchronized between Supabase and ClubReady
- Confirmation details are displayed on the thank-you page
