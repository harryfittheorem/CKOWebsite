const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let prospectId = null;
let clubreadyUserId = null;

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 8000);
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.classList.add('hidden');
}

function formatCardNumber(value) {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
}

const cardNumberInput = document.getElementById('cardNumber');
if (cardNumberInput) {
  cardNumberInput.addEventListener('input', function(e) {
    e.target.value = formatCardNumber(e.target.value);
  });
}

const cardExpMonthInput = document.getElementById('cardExpMonth');
if (cardExpMonthInput) {
  cardExpMonthInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

const cardExpYearInput = document.getElementById('cardExpYear');
if (cardExpYearInput) {
  cardExpYearInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

const cardCvvInput = document.getElementById('cardCvv');
if (cardCvvInput) {
  cardCvvInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

async function searchOrCreateProspect() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  try {
    const searchResponse = await fetch(`${SUPABASE_URL}/functions/v1/clubready-search-prospect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, phone }),
    });

    const searchData = await searchResponse.json();

    if (searchResponse.ok && searchData.found && searchData.prospect) {
      prospectId = searchData.prospect.userId;
      clubreadyUserId = searchData.prospect.userId.toString();
      return true;
    }

    const createResponse = await fetch(`${SUPABASE_URL}/functions/v1/clubready-create-prospect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: null,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(createData.error || 'Failed to create prospect');
    }

    prospectId = createData.prospect.id;
    clubreadyUserId = createData.prospect.clubreadyUserId.toString();
    return true;
  } catch (error) {
    console.error('Error with prospect:', error);
    throw error;
  }
}

async function processPayment() {
  hideError();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const cardExpMonth = document.getElementById('cardExpMonth').value;
  const cardExpYear = document.getElementById('cardExpYear').value;
  const cardCvv = document.getElementById('cardCvv').value;
  const cardholderName = document.getElementById('cardholderName').value.trim();
  const billingZip = document.getElementById('billingZip').value.trim();
  const termsAccepted = document.getElementById('terms').checked;

  if (!firstName || !lastName || !email || !phone) {
    showError('Please fill in all required contact information fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }

  if (!cardNumber || !cardExpMonth || !cardExpYear || !cardCvv || !cardholderName || !billingZip) {
    showError('Please fill in all payment fields');
    return;
  }

  if (cardNumber.length < 13 || cardNumber.length > 19) {
    showError('Please enter a valid card number');
    return;
  }

  if (cardExpMonth.length !== 2 || parseInt(cardExpMonth) < 1 || parseInt(cardExpMonth) > 12) {
    showError('Please enter a valid expiration month (01-12)');
    return;
  }

  if (cardExpYear.length !== 4 || parseInt(cardExpYear) < new Date().getFullYear()) {
    showError('Please enter a valid expiration year');
    return;
  }

  if (cardCvv.length < 3 || cardCvv.length > 4) {
    showError('Please enter a valid CVV');
    return;
  }

  if (!termsAccepted) {
    showError('Please accept the Terms & Conditions and Liability Waiver');
    return;
  }

  if (!window.selectedPackageData) {
    showError('Please select a package');
    return;
  }

  const submitButton = document.getElementById('submitPayment');
  const submitText = document.getElementById('submit-text');
  const submitArrow = document.getElementById('submit-arrow');
  const submitSpinner = document.getElementById('submit-spinner');

  submitButton.disabled = true;
  submitText.textContent = 'Processing Your Payment...';
  submitArrow.classList.add('hidden');
  submitSpinner.classList.remove('hidden');

  try {
    if (!prospectId || !clubreadyUserId) {
      await searchOrCreateProspect();
    }

    const paymentData = {
      prospectId,
      clubreadyUserId,
      packageId: window.selectedPackageData.id,
      packageName: window.selectedPackageData.name,
      amount: window.selectedPackageData.price,
      cardNumber,
      cardExpMonth,
      cardExpYear,
      cardCvv,
      cardholderName,
      billingZip,
      firstName,
      lastName,
      email,
      phone
    };

    window.location.href = `thank-you-page.html?packageName=${encodeURIComponent(window.selectedPackageData.name)}&amount=${window.selectedPackageData.price}`;

  } catch (error) {
    console.error('Payment error:', error);
    showError(error.message || 'Payment processing failed. Please try again or call us at (281) 724-4422 for assistance.');

    submitButton.disabled = false;
    submitText.textContent = 'Complete Purchase - Claim Your Offer';
    submitArrow.classList.remove('hidden');
    submitSpinner.classList.add('hidden');
  }
}

window.processPayment = processPayment;
