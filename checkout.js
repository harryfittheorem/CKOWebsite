const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const TEST_MODE = new URLSearchParams(window.location.search).has('test') ||
                  window.location.hostname === 'localhost' ||
                  import.meta.env.VITE_TEST_MODE === 'true';

let currentStep = 1;
let selectedPackage = null;
let prospectId = null;
let clubreadyUserId = null;
let packages = [];

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.classList.add('hidden');
}

function updateStepIndicators(step) {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step${i}-indicator`);
    if (i < step) {
      indicator.classList.add('completed');
      indicator.classList.remove('active');
    } else if (i === step) {
      indicator.classList.add('active');
      indicator.classList.remove('completed');
    } else {
      indicator.classList.remove('active', 'completed');
    }
  }
}

function showStep(step) {
  for (let i = 1; i <= 3; i++) {
    const stepDiv = document.getElementById(`step${i}`);
    if (i === step) {
      stepDiv.classList.remove('hidden');
    } else {
      stepDiv.classList.add('hidden');
    }
  }
  currentStep = step;
  updateStepIndicators(step);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (TEST_MODE) {
  const testBanner = document.createElement('div');
  testBanner.className = 'fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 px-4 font-semibold text-sm z-[100] flex items-center justify-center gap-2';
  testBanner.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
    TEST MODE - No real charges will be made
  `;
  document.body.prepend(testBanner);
  document.querySelector('nav').style.marginTop = '40px';
}

async function goToStep2() {
  hideError();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!firstName || !lastName || !email || !phone) {
    showError('Please fill in all required fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError('Please enter a valid email address');
    return;
  }

  showStep(2);
  if (packages.length === 0) {
    await loadPackages();
  }
}

function goToStep1() {
  hideError();
  showStep(1);
}

async function goToStep3() {
  hideError();
  if (!selectedPackage) {
    showError('Please select a package');
    return;
  }

  const pkg = packages.find(p => p.clubready_package_id === selectedPackage);
  if (pkg) {
    document.getElementById('summary-package').textContent = pkg.name;
    document.getElementById('summary-duration').textContent = pkg.duration_months === 1
      ? '1 Month'
      : `${pkg.duration_months} Months`;
    document.getElementById('summary-total').textContent = `$${parseFloat(pkg.price).toFixed(2)}`;
  }

  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  document.getElementById('cardholderName').value = `${firstName} ${lastName}`;

  showStep(3);
}

function goToStep2FromPayment() {
  hideError();
  showStep(2);
}

async function loadPackages() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/clubready-get-packages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load packages');
    }

    packages = data.packages || [];
    renderPackages();
  } catch (error) {
    console.error('Error loading packages:', error);
    showError('Failed to load packages. Please refresh the page.');
  }
}

function renderPackages() {
  const container = document.getElementById('packages-container');

  if (packages.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <p>No packages available at this time. Please contact us for more information.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = packages.map(pkg => `
    <div class="package-card cursor-pointer p-6 bg-black border-2 border-white/10 rounded-sm transition-all hover:border-white/30"
         data-package-id="${pkg.clubready_package_id}"
         onclick="selectPackage('${pkg.clubready_package_id}')">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-xl font-heading font-bold uppercase mb-2">${pkg.name}</h3>
          ${pkg.description ? `<p class="text-gray-400 text-sm mb-4">${pkg.description}</p>` : ''}
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-accent">$${parseFloat(pkg.price).toFixed(2)}</span>
            <span class="text-gray-400 text-sm">/ ${pkg.duration_months === 1 ? 'month' : pkg.duration_months + ' months'}</span>
          </div>
        </div>
        <div class="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center package-radio">
          <div class="w-3 h-3 rounded-full bg-accent hidden"></div>
        </div>
      </div>
    </div>
  `).join('');
}

window.selectPackage = function(packageId) {
  selectedPackage = packageId;

  document.querySelectorAll('.package-card').forEach(card => {
    card.classList.remove('selected');
    const radio = card.querySelector('.package-radio div');
    radio.classList.add('hidden');
  });

  const selectedCard = document.querySelector(`[data-package-id="${packageId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    const radio = selectedCard.querySelector('.package-radio div');
    radio.classList.remove('hidden');
  }

  document.getElementById('continueToPayment').disabled = false;
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

document.getElementById('cardNumber').addEventListener('input', function(e) {
  e.target.value = formatCardNumber(e.target.value);
});

document.getElementById('cardExpMonth').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

document.getElementById('cardExpYear').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

document.getElementById('cardCvv').addEventListener('input', function(e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

async function searchOrCreateProspect() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const dateOfBirth = document.getElementById('dateOfBirth').value || null;

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
        dateOfBirth,
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

  const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const cardExpMonth = document.getElementById('cardExpMonth').value;
  const cardExpYear = document.getElementById('cardExpYear').value;
  const cardCvv = document.getElementById('cardCvv').value;
  const cardholderName = document.getElementById('cardholderName').value.trim();
  const billingZip = document.getElementById('billingZip').value.trim();

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

  const submitButton = document.getElementById('submitPayment');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');

  submitButton.disabled = true;
  submitText.classList.add('hidden');
  submitSpinner.classList.remove('hidden');

  try {
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Simulating payment without charging card');
      const pkg = packages.find(p => p.clubready_package_id === selectedPackage);

      await new Promise(resolve => setTimeout(resolve, 2000));

      window.location.href = `thank-you-page.html?test=true&transactionId=TEST-${Date.now()}&packageName=${encodeURIComponent(pkg.name)}&amount=${pkg.price}`;
      return;
    }

    if (!prospectId || !clubreadyUserId) {
      await searchOrCreateProspect();
    }

    const paymentResponse = await fetch(`${SUPABASE_URL}/functions/v1/clubready-process-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prospectId,
        clubreadyUserId,
        packageId: selectedPackage,
        cardNumber,
        cardExpMonth,
        cardExpYear,
        cardCvv,
        cardholderName,
        billingZip,
      }),
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      throw new Error(paymentData.error || 'Payment processing failed');
    }

    window.location.href = `thank-you-page.html?transactionId=${paymentData.transactionId}&packageName=${encodeURIComponent(paymentData.packageName)}&amount=${paymentData.amount}`;
  } catch (error) {
    console.error('Payment error:', error);
    showError(error.message || 'Payment processing failed. Please try again.');

    submitButton.disabled = false;
    submitText.classList.remove('hidden');
    submitSpinner.classList.add('hidden');
  }
}

window.goToStep1 = goToStep1;
window.goToStep2 = goToStep2;
window.goToStep3 = goToStep3;
window.processPayment = processPayment;
