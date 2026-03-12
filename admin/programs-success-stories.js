async function loadPrograms(locationSlug) {
  const programsList = document.getElementById('programs-list');
  programsList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading programs...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programs?location_slug=eq.${locationSlug}&order=display_order.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch programs');

    const programs = await response.json();

    if (programs.length === 0) {
      programsList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No programs found for this location.
        </div>
      `;
      return;
    }

    programsList.innerHTML = '';
    programs.forEach(program => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-gray-800 rounded-lg p-4';

      const leftDiv = document.createElement('div');
      leftDiv.className = 'flex items-center gap-4';

      const infoDiv = document.createElement('div');
      const title = document.createElement('h4');
      title.className = 'text-white font-medium';
      title.textContent = program.name;
      infoDiv.appendChild(title);

      if (program.duration) {
        const duration = document.createElement('p');
        duration.className = 'text-gray-400 text-sm';
        duration.textContent = program.duration;
        infoDiv.appendChild(duration);
      }

      leftDiv.appendChild(infoDiv);

      const rightDiv = document.createElement('div');
      rightDiv.className = 'flex items-center gap-3';

      if (program.is_corporate_template) {
        const corporateBadge = document.createElement('span');
        corporateBadge.className = 'px-3 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-300';
        corporateBadge.textContent = 'Corporate';
        rightDiv.appendChild(corporateBadge);
      }

      const activeBadge = document.createElement('span');
      activeBadge.className = `px-3 py-1 rounded-full text-xs font-medium ${program.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`;
      activeBadge.textContent = program.is_active ? 'Active' : 'Inactive';
      rightDiv.appendChild(activeBadge);

      const editBtn = document.createElement('button');
      editBtn.className = 'text-accent hover:text-[#e5b000] transition-colors';
      editBtn.onclick = () => window.editProgram(program.id);
      editBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      `;
      rightDiv.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'text-red-400 hover:text-red-300 transition-colors';
      deleteBtn.onclick = () => window.deleteProgram(program.id);
      deleteBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      `;
      rightDiv.appendChild(deleteBtn);

      row.appendChild(leftDiv);
      row.appendChild(rightDiv);
      programsList.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading programs:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-center text-red-400 py-8';
    errorDiv.textContent = 'Failed to load programs. Please try again.';
    programsList.innerHTML = '';
    programsList.appendChild(errorDiv);
  }
}

async function loadSuccessStories(locationSlug) {
  const storiesList = document.getElementById('success-stories-list');
  storiesList.innerHTML = `
    <div class="text-center text-gray-500 py-8">
      <svg class="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading success stories...
    </div>
  `;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/success_stories?location_slug=eq.${locationSlug}&order=display_order.asc`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch success stories');

    const stories = await response.json();

    if (stories.length === 0) {
      storiesList.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          No success stories found for this location.
        </div>
      `;
      return;
    }

    storiesList.innerHTML = '';
    stories.forEach(story => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between bg-gray-800 rounded-lg p-4';

      const leftDiv = document.createElement('div');
      leftDiv.className = 'flex items-center gap-4';

      const infoDiv = document.createElement('div');
      const memberName = document.createElement('h4');
      memberName.className = 'text-white font-medium';
      memberName.textContent = story.member_name;
      infoDiv.appendChild(memberName);

      if (story.program_name) {
        const programName = document.createElement('p');
        programName.className = 'text-gray-400 text-sm';
        programName.textContent = story.program_name;
        infoDiv.appendChild(programName);
      }

      leftDiv.appendChild(infoDiv);

      const rightDiv = document.createElement('div');
      rightDiv.className = 'flex items-center gap-3';

      const activeBadge = document.createElement('span');
      activeBadge.className = `px-3 py-1 rounded-full text-xs font-medium ${story.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`;
      activeBadge.textContent = story.is_active ? 'Active' : 'Inactive';
      rightDiv.appendChild(activeBadge);

      const editBtn = document.createElement('button');
      editBtn.className = 'text-accent hover:text-[#e5b000] transition-colors';
      editBtn.onclick = () => window.editSuccessStory(story.id);
      editBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      `;
      rightDiv.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'text-red-400 hover:text-red-300 transition-colors';
      deleteBtn.onclick = () => window.deleteSuccessStory(story.id);
      deleteBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      `;
      rightDiv.appendChild(deleteBtn);

      row.appendChild(leftDiv);
      row.appendChild(rightDiv);
      storiesList.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading success stories:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-center text-red-400 py-8';
    errorDiv.textContent = 'Failed to load success stories. Please try again.';
    storiesList.innerHTML = '';
    storiesList.appendChild(errorDiv);
  }
}

document.getElementById('add-program-btn').addEventListener('click', () => {
  document.getElementById('program-form-title').textContent = 'Add Program';
  document.getElementById('program-submit-btn').textContent = 'Add Program';
  document.getElementById('program-form').reset();
  document.getElementById('program-id').value = '';
  document.getElementById('program-is-corporate').value = 'false';
  document.getElementById('program-image-url').value = '';
  document.getElementById('program-image-preview-container').classList.add('hidden');
  document.getElementById('program-modal').classList.remove('hidden');
});

document.getElementById('add-corporate-program-btn').addEventListener('click', () => {
  document.getElementById('program-form-title').textContent = 'Add Corporate Template';
  document.getElementById('program-submit-btn').textContent = 'Add Corporate Template';
  document.getElementById('program-form').reset();
  document.getElementById('program-id').value = '';
  document.getElementById('program-is-corporate').value = 'true';
  document.getElementById('program-image-url').value = '';
  document.getElementById('program-image-preview-container').classList.add('hidden');
  document.getElementById('program-modal').classList.remove('hidden');
});

document.getElementById('close-program-form').addEventListener('click', () => {
  document.getElementById('program-modal').classList.add('hidden');
});

document.getElementById('cancel-program-form').addEventListener('click', () => {
  document.getElementById('program-modal').classList.add('hidden');
});

document.getElementById('program-image-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('program-upload-status');
  const previewContainer = document.getElementById('program-image-preview-container');
  const preview = document.getElementById('program-image-preview');

  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-xs mt-1 text-blue-400';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const filePath = `programs/${timestamp}-${file.name}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) throw new Error('Upload failed');

    const publicURL = `${SUPABASE_URL}/storage/v1/object/public/location-media/${filePath}`;
    document.getElementById('program-image-url').value = publicURL;

    preview.src = publicURL;
    previewContainer.classList.remove('hidden');

    statusEl.textContent = 'Upload successful!';
    statusEl.className = 'text-xs mt-1 text-green-400';

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Error uploading image:', error);
    statusEl.textContent = 'Upload failed. Please try again.';
    statusEl.className = 'text-xs mt-1 text-red-400';
  }
});

window.editProgram = async function(programId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programs?id=eq.${programId}`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch program');

    const programs = await response.json();
    if (programs.length === 0) throw new Error('Program not found');

    const program = programs[0];

    document.getElementById('program-form-title').textContent = 'Edit Program';
    document.getElementById('program-submit-btn').textContent = 'Update Program';
    document.getElementById('program-id').value = program.id;
    document.getElementById('program-is-corporate').value = program.is_corporate_template ? 'true' : 'false';
    document.getElementById('program-name').value = program.name || '';
    document.getElementById('program-duration').value = program.duration || '';
    document.getElementById('program-description').value = program.description || '';
    document.getElementById('program-whats-included').value = program.whats_included || '';
    document.getElementById('program-cta-label').value = program.cta_label || '';
    document.getElementById('program-cta-url').value = program.cta_url || '';
    document.getElementById('program-display-order').value = program.display_order || 0;
    document.getElementById('program-active').checked = program.is_active !== false;

    if (program.image_url) {
      document.getElementById('program-image-url').value = program.image_url;
      document.getElementById('program-image-preview').src = program.image_url;
      document.getElementById('program-image-preview-container').classList.remove('hidden');
    } else {
      document.getElementById('program-image-url').value = '';
      document.getElementById('program-image-preview-container').classList.add('hidden');
    }

    document.getElementById('program-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading program:', error);
    alert('Failed to load program details');
  }
};

window.deleteProgram = async function(programId) {
  if (!confirm('Are you sure you want to delete this program?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programs?id=eq.${programId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) throw new Error('Failed to delete program');

    showToast('Program deleted successfully!');
    loadPrograms(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting program:', error);
    alert('Failed to delete program');
  }
};

document.getElementById('program-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const programId = document.getElementById('program-id').value;
  const isCorporate = document.getElementById('program-is-corporate').value === 'true';
  const isEdit = !!programId;

  const programData = {
    location_slug: isCorporate ? null : currentLocation.slug,
    name: document.getElementById('program-name').value.trim(),
    duration: document.getElementById('program-duration').value.trim() || null,
    description: document.getElementById('program-description').value.trim() || null,
    whats_included: document.getElementById('program-whats-included').value.trim() || null,
    cta_label: document.getElementById('program-cta-label').value.trim() || null,
    cta_url: document.getElementById('program-cta-url').value.trim() || null,
    image_url: document.getElementById('program-image-url').value.trim() || null,
    is_active: document.getElementById('program-active').checked,
    is_corporate_template: isCorporate,
    display_order: parseInt(document.getElementById('program-display-order').value) || 0
  };

  try {
    let response;

    if (isEdit) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/programs?id=eq.${programId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(programData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/programs`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(programData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save program');
    }

    showToast(isEdit ? 'Program updated successfully!' : 'Program added successfully!');
    document.getElementById('program-modal').classList.add('hidden');
    loadPrograms(currentLocation.slug);
  } catch (error) {
    console.error('Error saving program:', error);
    alert(`Failed to save program: ${error.message}`);
  }
});

document.getElementById('add-success-story-btn').addEventListener('click', () => {
  document.getElementById('success-story-form-title').textContent = 'Add Success Story';
  document.getElementById('success-story-submit-btn').textContent = 'Add Success Story';
  document.getElementById('success-story-form').reset();
  document.getElementById('success-story-id').value = '';
  document.getElementById('success-story-before-url').value = '';
  document.getElementById('success-story-after-url').value = '';
  document.getElementById('success-story-before-preview-container').classList.add('hidden');
  document.getElementById('success-story-after-preview-container').classList.add('hidden');
  document.getElementById('success-story-modal').classList.remove('hidden');
});

document.getElementById('close-success-story-form').addEventListener('click', () => {
  document.getElementById('success-story-modal').classList.add('hidden');
});

document.getElementById('cancel-success-story-form').addEventListener('click', () => {
  document.getElementById('success-story-modal').classList.add('hidden');
});

document.getElementById('success-story-before-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('success-story-before-status');
  const previewContainer = document.getElementById('success-story-before-preview-container');
  const preview = document.getElementById('success-story-before-preview');

  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-xs mt-1 text-blue-400';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const filePath = `success-stories/before-${timestamp}-${file.name}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) throw new Error('Upload failed');

    const publicURL = `${SUPABASE_URL}/storage/v1/object/public/location-media/${filePath}`;
    document.getElementById('success-story-before-url').value = publicURL;

    preview.src = publicURL;
    previewContainer.classList.remove('hidden');

    statusEl.textContent = 'Upload successful!';
    statusEl.className = 'text-xs mt-1 text-green-400';

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Error uploading image:', error);
    statusEl.textContent = 'Upload failed. Please try again.';
    statusEl.className = 'text-xs mt-1 text-red-400';
  }
});

document.getElementById('success-story-after-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('success-story-after-status');
  const previewContainer = document.getElementById('success-story-after-preview-container');
  const preview = document.getElementById('success-story-after-preview');

  statusEl.textContent = 'Uploading...';
  statusEl.className = 'text-xs mt-1 text-blue-400';
  statusEl.classList.remove('hidden');

  try {
    const timestamp = Date.now();
    const filePath = `success-stories/after-${timestamp}-${file.name}`;

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/location-media/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) throw new Error('Upload failed');

    const publicURL = `${SUPABASE_URL}/storage/v1/object/public/location-media/${filePath}`;
    document.getElementById('success-story-after-url').value = publicURL;

    preview.src = publicURL;
    previewContainer.classList.remove('hidden');

    statusEl.textContent = 'Upload successful!';
    statusEl.className = 'text-xs mt-1 text-green-400';

    setTimeout(() => {
      statusEl.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Error uploading image:', error);
    statusEl.textContent = 'Upload failed. Please try again.';
    statusEl.className = 'text-xs mt-1 text-red-400';
  }
});

window.editSuccessStory = async function(storyId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/success_stories?id=eq.${storyId}`, {
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch success story');

    const stories = await response.json();
    if (stories.length === 0) throw new Error('Success story not found');

    const story = stories[0];

    document.getElementById('success-story-form-title').textContent = 'Edit Success Story';
    document.getElementById('success-story-submit-btn').textContent = 'Update Success Story';
    document.getElementById('success-story-id').value = story.id;
    document.getElementById('success-story-member-name').value = story.member_name || '';
    document.getElementById('success-story-program-name').value = story.program_name || '';
    document.getElementById('success-story-story').value = story.story || '';
    document.getElementById('success-story-result-stat').value = story.result_stat || '';
    document.getElementById('success-story-display-order').value = story.display_order || 0;
    document.getElementById('success-story-active').checked = story.is_active !== false;

    if (story.before_image_url) {
      document.getElementById('success-story-before-url').value = story.before_image_url;
      document.getElementById('success-story-before-preview').src = story.before_image_url;
      document.getElementById('success-story-before-preview-container').classList.remove('hidden');
    } else {
      document.getElementById('success-story-before-url').value = '';
      document.getElementById('success-story-before-preview-container').classList.add('hidden');
    }

    if (story.after_image_url) {
      document.getElementById('success-story-after-url').value = story.after_image_url;
      document.getElementById('success-story-after-preview').src = story.after_image_url;
      document.getElementById('success-story-after-preview-container').classList.remove('hidden');
    } else {
      document.getElementById('success-story-after-url').value = '';
      document.getElementById('success-story-after-preview-container').classList.add('hidden');
    }

    document.getElementById('success-story-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading success story:', error);
    alert('Failed to load success story details');
  }
};

window.deleteSuccessStory = async function(storyId) {
  if (!confirm('Are you sure you want to delete this success story?')) return;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/success_stories?id=eq.${storyId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) throw new Error('Failed to delete success story');

    showToast('Success story deleted successfully!');
    loadSuccessStories(currentLocation.slug);
  } catch (error) {
    console.error('Error deleting success story:', error);
    alert('Failed to delete success story');
  }
};

document.getElementById('success-story-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const storyId = document.getElementById('success-story-id').value;
  const isEdit = !!storyId;

  const storyData = {
    location_slug: currentLocation.slug,
    member_name: document.getElementById('success-story-member-name').value.trim(),
    program_name: document.getElementById('success-story-program-name').value.trim() || null,
    story: document.getElementById('success-story-story').value.trim() || null,
    result_stat: document.getElementById('success-story-result-stat').value.trim() || null,
    before_image_url: document.getElementById('success-story-before-url').value.trim() || null,
    after_image_url: document.getElementById('success-story-after-url').value.trim() || null,
    is_active: document.getElementById('success-story-active').checked,
    display_order: parseInt(document.getElementById('success-story-display-order').value) || 0
  };

  try {
    let response;

    if (isEdit) {
      response = await fetch(`${SUPABASE_URL}/rest/v1/success_stories?id=eq.${storyId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storyData)
      });
    } else {
      response = await fetch(`${SUPABASE_URL}/rest/v1/success_stories`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(storyData)
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save success story');
    }

    showToast(isEdit ? 'Success story updated successfully!' : 'Success story added successfully!');
    document.getElementById('success-story-modal').classList.add('hidden');
    loadSuccessStories(currentLocation.slug);
  } catch (error) {
    console.error('Error saving success story:', error);
    alert(`Failed to save success story: ${error.message}`);
  }
});
