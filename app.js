// ==========================================================
// LOGIKA UTAMA APLIKASI WEB HK A 2025
// Mobile-First Bio-Link, Interactive Gallery & Admin Panel
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi ikon Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // State Aplikasi
  const state = {
    activeTab: 'links', // 'links' | 'gallery' | 'messages'
    activeCategory: 'Semua',
    photos: [],
    isAdmin: false,
    selectedPhoto: null,
    supabaseClient: null,
    pendingUploadFiles: [],
  };

  // Inisialisasi Supabase jika konfigurasi tersedia
  const initSupabase = () => {
    if (
      window.CONFIG &&
      window.CONFIG.supabase &&
      window.CONFIG.supabase.url &&
      window.CONFIG.supabase.anonKey &&
      window.supabase
    ) {
      try {
        state.supabaseClient = window.supabase.createClient(
          window.CONFIG.supabase.url,
          window.CONFIG.supabase.anonKey
        );
        console.log('✅ Supabase Client berhasil terhubung.');
      } catch (err) {
        console.warn('⚠️ Gagal inisialisasi Supabase:', err);
      }
    }
  };

  // Cek Status Sesi Admin
  const checkAdminAuth = () => {
    const saved = localStorage.getItem(window.CONFIG.admin.sessionKey);
    if (saved === 'authenticated') {
      state.isAdmin = true;
    }
    updateAdminUI();
  };

  // Perbarui UI Mode Admin
  const updateAdminUI = () => {
    const adminBanner = document.getElementById('admin-banner');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const btnUploadPhoto = document.getElementById('btn-upload-photo');
    const adminMsgSection = document.getElementById('admin-messages-section');

    if (state.isAdmin) {
      if (adminBanner) adminBanner.classList.remove('hidden');
      if (btnAdminLogin) btnAdminLogin.classList.add('hidden');
      if (btnUploadPhoto) btnUploadPhoto.classList.remove('hidden');
      if (adminMsgSection) adminMsgSection.classList.remove('hidden');
    } else {
      if (adminBanner) adminBanner.classList.add('hidden');
      if (btnAdminLogin) btnAdminLogin.classList.remove('hidden');
      if (btnUploadPhoto) btnUploadPhoto.classList.add('hidden');
      if (adminMsgSection) adminMsgSection.classList.add('hidden');
    }

    renderGallery();
    if (state.isAdmin) {
      renderAdminMessages();
    }
  };

  // Muat Foto (Dari Supabase atau LocalStorage / Demo)
  const loadPhotos = async () => {
    const galleryLoader = document.getElementById('gallery-loader');
    if (galleryLoader) galleryLoader.classList.remove('hidden');

    // Coba ambil dari Supabase
    if (state.supabaseClient) {
      try {
        const { data, error } = await state.supabaseClient
          .from('gallery_photos')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          state.photos = data.map((item) => {
            const isVideo =
              item.media_type === 'video' ||
              (item.image_url &&
                (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(item.image_url) ||
                  item.image_url.startsWith('data:video')));
            return {
              id: item.id,
              title: item.title,
              category: item.category || 'Kuliah',
              date: item.date || new Date(item.created_at).toISOString().split('T')[0],
              imageUrl: item.image_url,
              caption: item.caption || '',
              mediaType: isVideo ? 'video' : 'image',
            };
          });
          if (galleryLoader) galleryLoader.classList.add('hidden');
          updatePhotoCountBadge();
          renderGallery();
          return;
        }
      } catch (err) {
        console.warn('Gagal mengambil dari Supabase, fallback ke lokal:', err);
      }
    }

    // Fallback: Ambil dari LocalStorage
    const localCached = localStorage.getItem('hka_gallery_photos_v1');
    if (localCached) {
      try {
        state.photos = JSON.parse(localCached);
      } catch (e) {
        state.photos = [...window.CONFIG.initialPhotos];
      }
    } else {
      state.photos = [...window.CONFIG.initialPhotos];
    }

    if (galleryLoader) galleryLoader.classList.add('hidden');
    updatePhotoCountBadge();
    renderGallery();
  };

  // Simpan foto ke LocalStorage (fallback)
  const savePhotosLocally = () => {
    try {
      localStorage.setItem('hka_gallery_photos_v1', JSON.stringify(state.photos));
    } catch (e) {
      console.warn('Storage limit reached:', e);
    }
  };

  // Perbarui Badge Total Media (Foto & Video)
  const updatePhotoCountBadge = () => {
    const badge = document.getElementById('gallery-count-badge');
    const badgeTab = document.getElementById('gallery-tab-count');
    const count = state.photos.length;
    if (badge) badge.textContent = `${count} Media`;
    if (badgeTab) badgeTab.textContent = count;
  };

  // Render Grid Galeri Foto
  const renderGallery = () => {
    const container = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty');
    if (!container) return;

    // Filter berdasarkan kategori aktif
    const filtered =
      state.activeCategory === 'Semua'
        ? state.photos
        : state.photos.filter((p) => p.category === state.activeCategory);

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = filtered
      .map((photo) => {
        const isVideo =
          photo.mediaType === 'video' ||
          (photo.imageUrl &&
            (photo.imageUrl.includes('.mp4') ||
              photo.imageUrl.includes('.webm') ||
              photo.imageUrl.includes('.mov') ||
              photo.imageUrl.startsWith('data:video')));

        return `
        <div class="gallery-photo-item group relative overflow-hidden rounded-2xl border border-[#eddcd0] bg-white shadow-xs hover:shadow-md cursor-pointer" data-id="${photo.id}">
          <div class="aspect-square w-full overflow-hidden bg-[#f5eee7] relative flex items-center justify-center">
            ${
              isVideo
                ? `
                <video 
                  src="${photo.imageUrl}" 
                  preload="metadata"
                  class="h-full w-full object-cover pointer-events-none"
                ></video>
                <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                  <div class="h-10 w-10 rounded-full bg-white/90 text-[#753e1f] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <i data-lucide="play" class="w-5 h-5 ml-0.5 fill-current"></i>
                  </div>
                </div>
                <span class="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-black/60 text-white backdrop-blur-xs border border-white/20">
                  ▶ Video
                </span>
              `
                : `
                <img 
                  src="${photo.imageUrl}" 
                  alt="${photo.title}" 
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onerror="this.src='https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'"
                />
              `
            }
          </div>

          <!-- Overlay Info Saat Hover / Mobile -->
          <div class="photo-overlay absolute inset-0 bg-gradient-to-t from-[#2c150c]/90 via-[#2c150c]/40 to-transparent p-3.5 flex flex-col justify-end text-left opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#9d5f2f] text-white border border-[#8c4e24]">
                ${isVideo ? '▶ ' : ''}${photo.category}
              </span>
              <span class="text-[11px] text-[#eddcd0]">${photo.date || ''}</span>
            </div>
            <h4 class="text-sm font-semibold text-white line-clamp-1">${photo.title}</h4>
            ${photo.caption ? `<p class="text-[11px] text-[#f5eee7] line-clamp-1 mt-0.5">${photo.caption}</p>` : ''}
          </div>

          <!-- Tombol Hapus Khusus Admin -->
          ${
            state.isAdmin
              ? `
            <button 
              type="button"
              class="btn-delete-photo absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500 active:scale-95 transition-all"
              data-id="${photo.id}"
              title="Hapus media ini"
            >
              <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
          `
              : ''
          }
        </div>
      `;
      })
      .join('');

    // Re-trigger icon creation
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Pasang Event Listener Click Foto untuk Lightbox
    container.querySelectorAll('.gallery-photo-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        // Jangan buka lightbox jika tombol hapus yang diklik
        if (e.target.closest('.btn-delete-photo')) return;
        const id = item.getAttribute('data-id');
        const photo = state.photos.find((p) => p.id === id);
        if (photo) openLightbox(photo);
      });
    });

    // Pasang Event Listener Tombol Hapus
    container.querySelectorAll('.btn-delete-photo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        confirmDeletePhoto(id);
      });
    });
  };

  // Navigasi Antar Halaman (Menu Utama, Galeri, dan Pesan)
  const setupTabs = () => {
    const tabContents = document.querySelectorAll('.tab-content-pane');

    const switchPane = (targetPaneId) => {
      tabContents.forEach((pane) => {
        if (pane.id === targetPaneId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Buka Galeri dari Menu Depan
    const shortcutGaleri = document.getElementById('shortcut-to-gallery');
    if (shortcutGaleri) {
      shortcutGaleri.addEventListener('click', (e) => {
        e.preventDefault();
        switchPane('tab-pane-gallery');
      });
    }

    // Buka Pesan dari Menu Depan
    const shortcutPesan = document.getElementById('shortcut-to-messages');
    if (shortcutPesan) {
      shortcutPesan.addEventListener('click', (e) => {
        e.preventDefault();
        switchPane('tab-pane-messages');
      });
    }

    // Tombol Kembali ke Menu Utama
    document.querySelectorAll('.btn-back-to-home').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchPane('tab-pane-links');
      });
    });

    // Pintasan Admin Banner
    const adminGotoGaleri = document.getElementById('btn-admin-goto-gallery');
    if (adminGotoGaleri) {
      adminGotoGaleri.addEventListener('click', () => switchPane('tab-pane-gallery'));
    }

    const adminGotoPesan = document.getElementById('btn-admin-goto-messages');
    if (adminGotoPesan) {
      adminGotoPesan.addEventListener('click', () => switchPane('tab-pane-messages'));
    }

    // Hubungkan Link Google Drive dari config.js
    const btnGdrive = document.getElementById('btn-gallery-gdrive');
    if (
      btnGdrive &&
      window.CONFIG &&
      window.CONFIG.links &&
      window.CONFIG.links.gdrive &&
      window.CONFIG.links.gdrive.url
    ) {
      btnGdrive.href = window.CONFIG.links.gdrive.url;
    }

    // Hubungkan Link & Username TikTok dari config.js
    const linkTiktok = document.getElementById('link-card-tiktok');
    const textTiktok = document.getElementById('tiktok-display-text');
    if (window.CONFIG && window.CONFIG.links && window.CONFIG.links.tiktok) {
      if (linkTiktok && window.CONFIG.links.tiktok.url) {
        linkTiktok.href = window.CONFIG.links.tiktok.url;
      }
      if (textTiktok && window.CONFIG.links.tiktok.handle) {
        textTiktok.textContent = `TikTok ${window.CONFIG.links.tiktok.handle}`;
      }
    }
  };

  // Setup Kategori Filter
  const setupCategories = () => {
    const filterContainer = document.getElementById('category-filters');
    if (!filterContainer) return;

    filterContainer.innerHTML = window.CONFIG.categories
      .map(
        (cat) => `
        <button 
          class="btn-category px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            cat === state.activeCategory
              ? 'bg-[#9d5f2f] text-white shadow-xs border border-[#8c4e24]'
              : 'bg-white text-[#753e1f] hover:bg-[#f5eee7] border border-[#eddcd0]'
          }"
          data-cat="${cat}"
        >
          ${cat}
        </button>
      `
      )
      .join('');

    filterContainer.querySelectorAll('.btn-category').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.getAttribute('data-cat');
        setupCategories();
        renderGallery();
      });
    });
  };

  // Lightbox Modal Handler (Mendukung Foto & Video)
  const lightboxModal = document.getElementById('modal-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxVideo = document.getElementById('lightbox-video');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const btnDownloadPhoto = document.getElementById('btn-download-photo');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');

  const openLightbox = (photo) => {
    state.selectedPhoto = photo;
    const isVideo =
      photo.mediaType === 'video' ||
      (photo.imageUrl &&
        (photo.imageUrl.includes('.mp4') ||
          photo.imageUrl.includes('.webm') ||
          photo.imageUrl.includes('.mov') ||
          photo.imageUrl.startsWith('data:video')));

    if (isVideo) {
      if (lightboxImg) lightboxImg.classList.add('hidden');
      if (lightboxVideo) {
        lightboxVideo.classList.remove('hidden');
        lightboxVideo.src = photo.imageUrl;
        lightboxVideo.play().catch(() => {});
      }
    } else {
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.src = '';
        lightboxVideo.classList.add('hidden');
      }
      if (lightboxImg) {
        lightboxImg.classList.remove('hidden');
        lightboxImg.src = photo.imageUrl;
      }
    }

    if (lightboxTitle) lightboxTitle.textContent = photo.title;
    if (lightboxCategory)
      lightboxCategory.textContent = isVideo ? `▶ Video • ${photo.category}` : photo.category;
    if (lightboxDate) lightboxDate.textContent = photo.date || '';
    if (lightboxCaption) {
      lightboxCaption.textContent = photo.caption || '';
      lightboxCaption.style.display = photo.caption ? 'block' : 'none';
    }
    if (lightboxModal) lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.src = '';
    }
    if (lightboxModal) lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });
  }

  // Tombol Download Media di Lightbox
  if (btnDownloadPhoto) {
    btnDownloadPhoto.addEventListener('click', async () => {
      if (!state.selectedPhoto) return;
      const isVideo =
        state.selectedPhoto.mediaType === 'video' ||
        (state.selectedPhoto.imageUrl &&
          (state.selectedPhoto.imageUrl.includes('.mp4') ||
            state.selectedPhoto.imageUrl.includes('.webm') ||
            state.selectedPhoto.imageUrl.includes('.mov') ||
            state.selectedPhoto.imageUrl.startsWith('data:video')));

      const ext = isVideo ? 'mp4' : 'jpg';

      try {
        const response = await fetch(state.selectedPhoto.imageUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `HK-A-2025_${state.selectedPhoto.title.replace(/\s+/g, '_')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // Fallback buka di tab baru jika CORS
        window.open(state.selectedPhoto.imageUrl, '_blank');
      }
    });
  }

  // Modal Login Admin (PIN)
  const modalAdminLogin = document.getElementById('modal-admin-login');
  const btnAdminLogin = document.getElementById('btn-admin-login');
  const btnCloseAdminModal = document.getElementById('btn-close-admin-modal');
  const formAdminLogin = document.getElementById('form-admin-login');
  const inputAdminPin = document.getElementById('input-admin-pin');
  const adminPinError = document.getElementById('admin-pin-error');
  const btnAdminLogout = document.getElementById('btn-admin-logout');

  if (btnAdminLogin) {
    btnAdminLogin.addEventListener('click', () => {
      if (inputAdminPin) inputAdminPin.value = '';
      if (adminPinError) adminPinError.classList.add('hidden');
      if (modalAdminLogin) modalAdminLogin.classList.add('open');
      if (inputAdminPin) setTimeout(() => inputAdminPin.focus(), 100);
    });
  }

  if (btnCloseAdminModal) {
    btnCloseAdminModal.addEventListener('click', () => {
      if (modalAdminLogin) modalAdminLogin.classList.remove('open');
    });
  }

  if (formAdminLogin) {
    formAdminLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = inputAdminPin.value.trim();

      if (enteredPin === window.CONFIG.admin.pin) {
        state.isAdmin = true;
        localStorage.setItem(window.CONFIG.admin.sessionKey, 'authenticated');
        if (modalAdminLogin) modalAdminLogin.classList.remove('open');
        showToast('Berhasil masuk sebagai Admin Pengurus HK A!');
        updateAdminUI();
      } else {
        if (adminPinError) {
          adminPinError.classList.remove('hidden');
          adminPinError.textContent = 'PIN salah! Silakan coba lagi.';
        }
      }
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      state.isAdmin = false;
      localStorage.removeItem(window.CONFIG.admin.sessionKey);
      showToast('Telah keluar dari mode Admin.');
      updateAdminUI();
    });
  }

  // Modal Upload Foto
  const modalUpload = document.getElementById('modal-upload-photo');
  const btnUploadPhoto = document.getElementById('btn-upload-photo');
  const btnCloseUpload = document.getElementById('btn-close-upload');
  const formUploadPhoto = document.getElementById('form-upload-photo');
  const fileInput = document.getElementById('upload-file-input');
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg = document.getElementById('upload-preview-img');
  const dropZone = document.getElementById('upload-dropzone');
  const btnSubmitUpload = document.getElementById('btn-submit-upload');

  if (btnUploadPhoto) {
    btnUploadPhoto.addEventListener('click', () => {
      if (formUploadPhoto) formUploadPhoto.reset();
      state.pendingUploadFiles = [];
      renderUploadPreviews();
      // Set default date today
      const inputDate = document.getElementById('upload-date');
      if (inputDate) inputDate.value = new Date().toISOString().split('T')[0];
      if (modalUpload) modalUpload.classList.add('open');
    });
  }

  if (btnCloseUpload) {
    btnCloseUpload.addEventListener('click', () => {
      if (modalUpload) modalUpload.classList.remove('open');
    });
  }

  // Render Thumbnail Preview untuk Banyak Foto
  const renderUploadPreviews = () => {
    const previewContainer = document.getElementById('upload-preview-container');
    const previewGrid = document.getElementById('upload-preview-grid');
    const previewCountBadge = document.getElementById('preview-badge-count');
    const topCountBadge = document.getElementById('upload-selected-count');
    const dropZone = document.getElementById('upload-dropzone');

    if (state.pendingUploadFiles.length === 0) {
      if (previewContainer) previewContainer.classList.add('hidden');
      if (dropZone) dropZone.classList.remove('hidden');
      if (topCountBadge) topCountBadge.textContent = '';
      return;
    }

    if (previewContainer) previewContainer.classList.remove('hidden');
    if (dropZone) dropZone.classList.add('hidden');

    const total = state.pendingUploadFiles.length;
    if (previewCountBadge) previewCountBadge.textContent = `${total} file dipilih`;
    if (topCountBadge) topCountBadge.textContent = `${total} file`;

    if (previewGrid) {
      previewGrid.innerHTML = state.pendingUploadFiles
        .map(
          (item, idx) => `
        <div class="relative group aspect-square rounded-xl overflow-hidden border border-[#dfc2b0] bg-stone-900 shadow-xs flex items-center justify-center">
          ${
            item.isVideo
              ? `<video src="${item.previewUrl}" class="w-full h-full object-cover pointer-events-none"></video>
                 <span class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#9d5f2f] text-[8px] font-bold text-white shadow-xs">▶ Video</span>`
              : `<img src="${item.previewUrl}" class="w-full h-full object-cover" />`
          }
          <button 
            type="button" 
            class="btn-remove-pending absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-[10px] hover:bg-rose-600 transition-colors shadow-xs"
            data-id="${item.id}"
            title="Hapus media ini"
          >
            ✕
          </button>
          <span class="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-[9px] text-white font-mono">
            #${idx + 1}
          </span>
        </div>
      `
        )
        .join('');

      previewGrid.querySelectorAll('.btn-remove-pending').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const removed = state.pendingUploadFiles.find((item) => item.id === id);
          if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
          state.pendingUploadFiles = state.pendingUploadFiles.filter((item) => item.id !== id);
          renderUploadPreviews();
        });
      });
    }
  };

  // Handle Pilih File Banyak Foto / Video
  const handleFilesSelection = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const newFiles = Array.from(filesList).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (newFiles.length === 0) {
      alert('Mohon pilih file gambar atau video yang valid (JPG, PNG, WEBP, MP4, MOV).');
      return;
    }

    newFiles.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      state.pendingUploadFiles.push({
        id: 'f_' + Math.random().toString(36).substring(2, 9),
        file,
        previewUrl,
        isVideo,
      });
    });

    renderUploadPreviews();
  };

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelection(e.target.files);
        // Reset input file value agar bisa pilih file yang sama jika diperlukan
        e.target.value = '';
      }
    });
  }

  // Drag and Drop
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-[#9d5f2f]', 'bg-[#f5eee7]');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-[#9d5f2f]', 'bg-[#f5eee7]');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-[#9d5f2f]', 'bg-[#f5eee7]');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelection(e.dataTransfer.files);
      }
    });
  }

  // Submit Upload Foto / Video (Bisa Banyak Sekaligus)
  if (formUploadPhoto) {
    formUploadPhoto.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.pendingUploadFiles || state.pendingUploadFiles.length === 0) {
        alert('Silakan pilih minimal 1 foto atau video terlebih dahulu!');
        return;
      }

      const baseTitle = document.getElementById('upload-title').value.trim();
      const category = document.getElementById('upload-category').value;
      const date = document.getElementById('upload-date').value;
      const caption = document.getElementById('upload-caption').value.trim();

      if (!baseTitle) {
        alert('Mohon isi judul kegiatan.');
        return;
      }

      const total = state.pendingUploadFiles.length;
      if (btnSubmitUpload) {
        btnSubmitUpload.disabled = true;
      }

      try {
        for (let i = 0; i < total; i++) {
          const item = state.pendingUploadFiles[i];
          const currentTitle = total === 1 ? baseTitle : `${baseTitle} (${i + 1})`;

          if (btnSubmitUpload) {
            btnSubmitUpload.innerHTML = `
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-2"></div>
              Mengunggah ${i + 1} dari ${total} media...
            `;
          }

          if (state.supabaseClient) {
            const fileExt = item.file.name.split('.').pop() || (item.isVideo ? 'mp4' : 'jpg');
            const fileName = `hk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload ke Supabase Storage Bucket
            const { error: uploadErr } = await state.supabaseClient.storage
              .from(window.CONFIG.supabase.bucketName || 'gallery')
              .upload(filePath, item.file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadErr) throw uploadErr;

            // 2. Dapatkan Public URL
            const { data: publicUrlData } = state.supabaseClient.storage
              .from(window.CONFIG.supabase.bucketName || 'gallery')
              .getPublicUrl(filePath);

            const finalImageUrl = publicUrlData.publicUrl;

            // 3. Simpan baris ke tabel gallery_photos
            const newRow = {
              title: currentTitle,
              category,
              date,
              caption,
              image_url: finalImageUrl,
            };

            const { data: insertData, error: insertErr } = await state.supabaseClient
              .from('gallery_photos')
              .insert([newRow])
              .select();

            if (insertErr) throw insertErr;

            if (insertData && insertData[0]) {
              state.photos.unshift({
                id: insertData[0].id,
                title: insertData[0].title,
                category: insertData[0].category,
                date: insertData[0].date,
                imageUrl: insertData[0].image_url,
                caption: insertData[0].caption,
                mediaType: item.isVideo ? 'video' : 'image',
              });
            }
          } else {
            // Mode Lokal: Konversi ke Base64
            const base64Url = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target.result);
              reader.readAsDataURL(item.file);
            });

            state.photos.unshift({
              id: 'local_' + Date.now() + '_' + i,
              title: currentTitle,
              category,
              date,
              caption,
              imageUrl: base64Url,
              mediaType: item.isVideo ? 'video' : 'image',
            });
          }
        }

        if (!state.supabaseClient) {
          savePhotosLocally();
        }

        // Bersihkan blob URLs
        state.pendingUploadFiles.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        state.pendingUploadFiles = [];

        if (modalUpload) modalUpload.classList.remove('open');
        showToast(`Berhasil mengunggah ${total} media ke galeri!`);
        updatePhotoCountBadge();
        renderGallery();
      } catch (error) {
        console.error('Error saat upload media:', error);
        alert('Gagal mengunggah media: ' + (error.message || 'Terjadi kesalahan'));
      } finally {
        if (btnSubmitUpload) {
          btnSubmitUpload.disabled = false;
          btnSubmitUpload.innerHTML = 'Unggah Media Sekarang';
        }
      }
    });
  }

  // Hapus Foto
  const confirmDeletePhoto = async (photoId) => {
    if (!state.isAdmin) return;
    const confirmAction = confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?');
    if (!confirmAction) return;

    try {
      if (state.supabaseClient) {
        const { error } = await state.supabaseClient
          .from('gallery_photos')
          .delete()
          .eq('id', photoId);

        if (error) throw error;
      }

      state.photos = state.photos.filter((p) => p.id !== photoId);
      savePhotosLocally();
      updatePhotoCountBadge();
      renderGallery();
      showToast('Foto berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus foto:', err);
      alert('Gagal menghapus foto: ' + err.message);
    }
  };

  // Kirim Pesan Anonim (NGL)
  const formAnonMessage = document.getElementById('form-anon-message');
  const inputAnonMessage = document.getElementById('input-anon-message');
  const btnSubmitMessage = document.getElementById('btn-submit-message');

  if (formAnonMessage) {
    formAnonMessage.addEventListener('submit', async (e) => {
      e.preventDefault();
      const messageText = inputAnonMessage.value.trim();
      if (!messageText) return;

      if (btnSubmitMessage) {
        btnSubmitMessage.disabled = true;
        btnSubmitMessage.innerHTML = `Mengirim...`;
      }

      try {
        if (state.supabaseClient) {
          await state.supabaseClient.from('anonymous_messages').insert([
            { message: messageText },
          ]);
        }

        // Simpan juga secara lokal untuk cache admin
        const cachedMsgs = JSON.parse(localStorage.getItem('hka_anon_messages') || '[]');
        cachedMsgs.unshift({
          id: 'msg_' + Date.now(),
          message: messageText,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('hka_anon_messages', JSON.stringify(cachedMsgs));

        inputAnonMessage.value = '';
        showToast('Pesan rahasiamu berhasil terkirim! 💌');
        if (state.isAdmin) renderAdminMessages();
      } catch (err) {
        console.error('Gagal mengirim pesan:', err);
        showToast('Pesan tersimpan secara lokal!');
      } finally {
        if (btnSubmitMessage) {
          btnSubmitMessage.disabled = false;
          btnSubmitMessage.innerHTML = `Kirim Pesan Rahasia 🚀`;
        }
      }
    });
  }

  // Render Pesan Anonim (Khusus Tampilan Admin)
  const renderAdminMessages = async () => {
    const listContainer = document.getElementById('admin-messages-list');
    if (!listContainer) return;

    let messages = [];
    if (state.supabaseClient) {
      try {
        const { data } = await state.supabaseClient
          .from('anonymous_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) messages = data;
      } catch (e) {
        messages = JSON.parse(localStorage.getItem('hka_anon_messages') || '[]');
      }
    } else {
      messages = JSON.parse(localStorage.getItem('hka_anon_messages') || '[]');
    }

    if (messages.length === 0) {
      listContainer.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">Belum ada pesan rahasia yang masuk.</p>`;
      return;
    }

    listContainer.innerHTML = messages
      .map(
        (m) => `
        <div class="rounded-xl border border-[#eddcd0] bg-white p-3 text-left shadow-xs">
          <p class="text-xs text-[#2c150c]">"${m.message}"</p>
          <span class="text-[10px] text-[#8c7163] mt-1 block">
            ${new Date(m.created_at).toLocaleString('id-ID')}
          </span>
        </div>
      `
      )
      .join('');
  };

  // Toast Notification
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#753e1f] px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-[#2c150c]/25 transition-all duration-300';
    toast.innerHTML = `<span>✓</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Tombol Salin Link Web
  const btnShare = document.getElementById('btn-share-profile');
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareData = {
        title: 'Hukum Keluarga A 2025 - UIN Siber Cirebon',
        text: 'Kunjungi website resmi & galeri foto kelas Hukum Keluarga A 2025!',
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {}
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Tautan web berhasil disalin ke papan klip!');
      }
    });
  }

  // Keyboard shortcut Esc untuk tutup modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      if (modalAdminLogin) modalAdminLogin.classList.remove('open');
      if (modalUpload) modalUpload.classList.remove('open');
    }
  });

  // Jalankan inisialisasi
  initSupabase();
  setupTabs();
  setupCategories();
  checkAdminAuth();
  loadPhotos();
});
