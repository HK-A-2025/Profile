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
    selectedPhotoIds: new Set(),
    lightboxIndex: 0,
    supabaseClient: null,
    pendingUploadFiles: [],
  };

  // Dapatkan daftar media aktif sesuai kategori terpilih
  const getActiveGalleryList = () => {
    return state.activeCategory === 'Semua'
      ? state.photos
      : state.photos.filter((p) => p.category === state.activeCategory);
  };

  // Ekstrak path file dari URL Supabase Storage untuk pembersihan storage
  const getStoragePathFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const bucket =
      (window.CONFIG && window.CONFIG.supabase && window.CONFIG.supabase.bucketName) ||
      'gallery';
    const marker = `/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const rawPath = url.substring(idx + marker.length);
      return decodeURIComponent(rawPath.split('?')[0]);
    }
    return null;
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
    const adminBatchToolbar = document.getElementById('admin-batch-toolbar');

    if (state.isAdmin) {
      if (adminBanner) adminBanner.classList.remove('hidden');
      if (btnAdminLogin) btnAdminLogin.classList.add('hidden');
      if (btnUploadPhoto) btnUploadPhoto.classList.remove('hidden');
      if (adminMsgSection) adminMsgSection.classList.remove('hidden');
      if (adminBatchToolbar && state.photos.length > 0) {
        adminBatchToolbar.classList.remove('hidden');
      }
    } else {
      if (adminBanner) adminBanner.classList.add('hidden');
      if (btnAdminLogin) btnAdminLogin.classList.remove('hidden');
      if (btnUploadPhoto) btnUploadPhoto.classList.add('hidden');
      if (adminMsgSection) adminMsgSection.classList.add('hidden');
      if (adminBatchToolbar) adminBatchToolbar.classList.add('hidden');
      state.selectedPhotoIds.clear();
    }

    renderGallery();
    updateBatchToolbar();
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

  // Perbarui Toolbar Seleksi Massal Foto Admin
  const updateBatchToolbar = () => {
    const adminBatchToolbar = document.getElementById('admin-batch-toolbar');
    const selectAllCheckbox = document.getElementById('batch-select-all-checkbox');
    const badgeCount = document.getElementById('batch-selected-count-badge');
    const btnDelete = document.getElementById('btn-batch-delete');
    const btnDeleteText = document.getElementById('btn-batch-delete-text');
    const btnDeselect = document.getElementById('btn-batch-deselect');

    if (!adminBatchToolbar) return;

    if (!state.isAdmin || state.photos.length === 0) {
      adminBatchToolbar.classList.add('hidden');
      return;
    }

    adminBatchToolbar.classList.remove('hidden');

    const visiblePhotos = getActiveGalleryList();
    const count = state.selectedPhotoIds.size;

    if (badgeCount) {
      badgeCount.textContent = `${count} dipilih`;
      if (count > 0) {
        badgeCount.className =
          'rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-300 shadow-xs';
      } else {
        badgeCount.className =
          'rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#9d5f2f] border border-amber-200 shadow-xs';
      }
    }

    if (btnDeselect) {
      if (count > 0) {
        btnDeselect.classList.remove('hidden');
      } else {
        btnDeselect.classList.add('hidden');
      }
    }

    if (btnDelete) {
      if (count > 0) {
        btnDelete.disabled = false;
        btnDelete.classList.remove('opacity-50', 'cursor-not-allowed');
        btnDelete.classList.add('hover:bg-rose-500', 'active:scale-95');
        if (btnDeleteText) {
          btnDeleteText.textContent = `Hapus (${count} Media)`;
        }
      } else {
        btnDelete.disabled = true;
        btnDelete.classList.add('opacity-50', 'cursor-not-allowed');
        btnDelete.classList.remove('hover:bg-rose-500', 'active:scale-95');
        if (btnDeleteText) {
          btnDeleteText.textContent = 'Hapus Terpilih';
        }
      }
    }

    if (selectAllCheckbox && visiblePhotos.length > 0) {
      const allSelected = visiblePhotos.every((p) => state.selectedPhotoIds.has(p.id));
      const someSelected = visiblePhotos.some((p) => state.selectedPhotoIds.has(p.id));
      selectAllCheckbox.checked = allSelected;
      selectAllCheckbox.indeterminate = !allSelected && someSelected;
    } else if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }
  };

  // Perbarui visual item galeri tanpa reload DOM
  const updateSelectionUI = () => {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    container.querySelectorAll('.gallery-photo-item').forEach((card) => {
      const id = card.getAttribute('data-id');
      const isSelected = state.selectedPhotoIds.has(id);
      const checkbox = card.querySelector('.photo-checkbox');
      const checkboxBox = card.querySelector('.checkbox-box');
      const selectWrapper = card.querySelector('.photo-select-wrapper');

      if (checkbox) checkbox.checked = isSelected;
      if (selectWrapper) {
        selectWrapper.title = isSelected ? 'Batal pilih media ini' : 'Pilih media ini';
      }

      if (isSelected) {
        card.classList.add('ring-2', 'ring-[#9d5f2f]', 'border-[#9d5f2f]');
        card.classList.remove('border-[#eddcd0]');
        if (checkboxBox) {
          checkboxBox.className =
            'checkbox-box flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all shadow-md bg-[#9d5f2f] border-[#9d5f2f] text-white ring-2 ring-white/90 scale-105';
        }
      } else {
        card.classList.remove('ring-2', 'ring-[#9d5f2f]', 'border-[#9d5f2f]');
        card.classList.add('border-[#eddcd0]');
        if (checkboxBox) {
          checkboxBox.className =
            'checkbox-box flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all shadow-md bg-white/95 border-[#c89a7c]/80 text-transparent hover:border-[#9d5f2f] hover:bg-white backdrop-blur-xs';
        }
      }
    });
  };

  // Toggle pilihan media satuan
  const togglePhotoSelection = (id) => {
    if (state.selectedPhotoIds.has(id)) {
      state.selectedPhotoIds.delete(id);
    } else {
      state.selectedPhotoIds.add(id);
    }
    updateSelectionUI();
    updateBatchToolbar();
  };

  // Render Grid Galeri Foto
  const renderGallery = () => {
    const container = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty');
    if (!container) return;

    // Filter berdasarkan kategori aktif
    const filtered = getActiveGalleryList();

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      updateBatchToolbar();
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
        const isSelected = state.selectedPhotoIds.has(photo.id);

        return `
        <div class="gallery-photo-item group relative overflow-hidden rounded-2xl border ${
          isSelected
            ? 'border-[#9d5f2f] ring-2 ring-[#9d5f2f] shadow-md'
            : 'border-[#eddcd0] bg-white shadow-xs hover:shadow-md'
        } cursor-pointer transition-all" data-id="${photo.id}">
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
                <span class="absolute ${state.isAdmin ? 'top-11' : 'top-2.5'} left-2.5 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-black/60 text-white backdrop-blur-xs border border-white/20 shadow-xs transition-all">
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
          <div class="photo-overlay absolute inset-0 bg-gradient-to-t from-[#2c150c]/90 via-[#2c150c]/40 to-transparent p-3.5 flex flex-col justify-end text-left opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#9d5f2f] text-white border border-[#8c4e24]">
                ${isVideo ? '▶ ' : ''}${photo.category}
              </span>
              <span class="text-[11px] text-[#eddcd0]">${photo.date || ''}</span>
            </div>
            <h4 class="text-sm font-semibold text-white line-clamp-1">${photo.title}</h4>
            ${photo.caption ? `<p class="text-[11px] text-[#f5eee7] line-clamp-1 mt-0.5">${photo.caption}</p>` : ''}
          </div>

          <!-- Checkbox Centang Foto (Khusus Admin) -->
          ${
            state.isAdmin
              ? `
            <div class="photo-select-wrapper absolute top-2.5 left-2.5 z-20" title="${isSelected ? 'Batal pilih media ini' : 'Pilih media ini'}">
              <label class="relative flex items-center justify-center cursor-pointer p-0.5 select-none">
                <input 
                  type="checkbox" 
                  class="photo-checkbox sr-only" 
                  data-id="${photo.id}" 
                  ${isSelected ? 'checked' : ''}
                />
                <div class="checkbox-box flex h-7 w-7 items-center justify-center rounded-lg border-2 transition-all shadow-md ${
                  isSelected 
                    ? 'bg-[#9d5f2f] border-[#9d5f2f] text-white ring-2 ring-white/90 scale-105' 
                    : 'bg-white/95 border-[#c89a7c]/80 text-transparent hover:border-[#9d5f2f] hover:bg-white backdrop-blur-xs'
                }">
                  <svg class="w-3.5 h-3.5 stroke-[3] fill-none stroke-current" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </label>
            </div>
          `
              : ''
          }

          <!-- Tombol Hapus Satuan Khusus Admin -->
          ${
            state.isAdmin
              ? `
            <button 
              type="button"
              class="btn-delete-photo absolute top-2.5 right-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/90 text-white shadow-md hover:bg-rose-500 active:scale-95 transition-all backdrop-blur-xs"
              data-id="${photo.id}"
              title="Hapus media ini"
            >
              <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
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

    // Pasang Event Listener Checkbox Pilih Foto (Khusus Admin)
    container.querySelectorAll('.photo-select-wrapper').forEach((wrapper) => {
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    container.querySelectorAll('.photo-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = checkbox.getAttribute('data-id');
        togglePhotoSelection(id);
      });
    });

    // Pasang Event Listener Click Foto untuk Lightbox
    container.querySelectorAll('.gallery-photo-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        // Jangan buka lightbox jika tombol hapus atau checkbox yang diklik
        if (e.target.closest('.btn-delete-photo') || e.target.closest('.photo-select-wrapper')) return;
        const id = item.getAttribute('data-id');
        const photo = state.photos.find((p) => p.id === id);
        if (photo) openLightbox(photo);
      });
    });

    // Pasang Event Listener Tombol Hapus Satuan
    container.querySelectorAll('.btn-delete-photo').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        confirmDeletePhoto(id);
      });
    });

    updateBatchToolbar();
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
  const lightboxIndexBadge = document.getElementById('lightbox-index-badge');
  const btnLightboxPrev = document.getElementById('btn-lightbox-prev');
  const btnLightboxNext = document.getElementById('btn-lightbox-next');
  const btnDownloadPhoto = document.getElementById('btn-download-photo');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');
  const openLightbox = (photo) => {
    state.selectedPhoto = photo;
    const currentList = getActiveGalleryList();
    const foundIdx = currentList.findIndex((p) => p.id === photo.id);
    state.lightboxIndex = foundIdx !== -1 ? foundIdx : 0;

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

    // Perbarui Nomor Urut Media (contoh: 2 / 5)
    if (lightboxIndexBadge) {
      if (currentList.length > 1) {
        lightboxIndexBadge.textContent = `${state.lightboxIndex + 1} / ${currentList.length}`;
        lightboxIndexBadge.classList.remove('hidden');
      } else {
        lightboxIndexBadge.classList.add('hidden');
      }
    }

    // Tampilkan tombol Prev/Next hanya jika ada lebih dari 1 media
    if (btnLightboxPrev && btnLightboxNext) {
      if (currentList.length <= 1) {
        btnLightboxPrev.classList.add('hidden');
        btnLightboxNext.classList.add('hidden');
      } else {
        btnLightboxPrev.classList.remove('hidden');
        btnLightboxNext.classList.remove('hidden');
      }
    }

    if (lightboxModal) lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Fungsi Pindah Media (Hanya saat tombol diklik - Tanpa usap/geser layar)
  const navigateLightbox = (direction) => {
    const list = getActiveGalleryList();
    if (!list || list.length <= 1) return;

    if (direction === 'next') {
      state.lightboxIndex = (state.lightboxIndex + 1) % list.length;
    } else if (direction === 'prev') {
      state.lightboxIndex = (state.lightboxIndex - 1 + list.length) % list.length;
    }
    openLightbox(list[state.lightboxIndex]);
  };

  if (btnLightboxPrev) {
    btnLightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox('prev');
    });
  }

  if (btnLightboxNext) {
    btnLightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox('next');
    });
  }

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

  // Fungsi Auto-Kompresi Gambar Pintar (Mengurangi ukuran file 80-90% tanpa mengurangi ketajaman Full HD)
  const compressImageFile = async (file, maxWidth = 1920, maxHeight = 1920, quality = 0.82) => {
    // Jika file bukan gambar, atau sudah kecil (< 200 KB), lewati kompresi
    if (!file.type.startsWith('image/') || file.size < 200 * 1024) {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Pertahankan rasio aspek dan batasi ukuran maksimum ke Full HD 1080p
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Ekspor ke JPEG dengan kompresi optimal
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                const compressedFile = new File([blob], cleanName, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(
                  `⚡ [Auto-Kompresi] ${file.name}: ${(file.size / 1024).toFixed(0)} KB ➔ ${(compressedFile.size / 1024).toFixed(0)} KB (Hemat ${Math.round((1 - compressedFile.size / file.size) * 100)}%)`
                );
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Submit Upload Foto / Video (Bisa Banyak Sekaligus + Auto-Kompresi)
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
              Mengoptimalkan & mengunggah ${i + 1} dari ${total} media...
            `;
          }

          // Cek batas ukuran video (maksimal 50 MB untuk Supabase)
          if (item.isVideo && item.file.size > 50 * 1024 * 1024) {
            alert(
              `Video "${item.file.name}" berukuran ${(item.file.size / 1024 / 1024).toFixed(1)} MB (melebihi batas 50 MB). Mohon gunakan video cuplikan pendek atau unggah ke Google Drive.`
            );
            continue;
          }

          // Jalankan Auto-Kompresi Otomatis pada Foto
          let uploadableFile = item.file;
          if (!item.isVideo) {
            uploadableFile = await compressImageFile(item.file);
          }

          if (state.supabaseClient) {
            const fileExt = uploadableFile.name.split('.').pop() || (item.isVideo ? 'mp4' : 'jpg');
            const fileName = `hk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload ke Supabase Storage Bucket
            const { error: uploadErr } = await state.supabaseClient.storage
              .from(window.CONFIG.supabase.bucketName || 'gallery')
              .upload(filePath, uploadableFile, {
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
            // Mode Lokal: Konversi ke Base64 (menggunakan file terkompresi)
            const base64Url = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target.result);
              reader.readAsDataURL(uploadableFile);
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
        showToast(`Berhasil mengunggah ${total} media (Auto-Kompresi Aktif ⚡)!`);
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

  // Setup Aksi Seleksi Massal & Hapus Banyak Foto
  const setupBatchManagement = () => {
    const selectAllCheckbox = document.getElementById('batch-select-all-checkbox');
    const btnDeselect = document.getElementById('btn-batch-deselect');
    const btnDelete = document.getElementById('btn-batch-delete');

    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', () => {
        const visiblePhotos = getActiveGalleryList();
        if (selectAllCheckbox.checked) {
          visiblePhotos.forEach((p) => state.selectedPhotoIds.add(p.id));
        } else {
          visiblePhotos.forEach((p) => state.selectedPhotoIds.delete(p.id));
        }
        updateSelectionUI();
        updateBatchToolbar();
      });
    }

    if (btnDeselect) {
      btnDeselect.addEventListener('click', () => {
        state.selectedPhotoIds.clear();
        updateSelectionUI();
        updateBatchToolbar();
      });
    }

    if (btnDelete) {
      btnDelete.addEventListener('click', async () => {
        const count = state.selectedPhotoIds.size;
        if (count === 0 || !state.isAdmin) return;

        const confirmAction = confirm(
          `Apakah Anda yakin ingin menghapus ${count} media terpilih dari galeri?\nTindakan ini tidak dapat dibatalkan.`
        );
        if (!confirmAction) return;

        const selectedIds = Array.from(state.selectedPhotoIds);
        const originalHtml = btnDelete.innerHTML;

        try {
          btnDelete.disabled = true;
          btnDelete.innerHTML = `
            <div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <span>Menghapus ${count}...</span>
          `;

          if (state.supabaseClient) {
            // 1. Bersihkan file dari Supabase Storage jika berasal dari storage bucket
            const storagePaths = [];
            selectedIds.forEach((id) => {
              const p = state.photos.find((photo) => photo.id === id);
              if (p && p.imageUrl) {
                const path = getStoragePathFromUrl(p.imageUrl);
                if (path) storagePaths.push(path);
              }
            });

            if (storagePaths.length > 0) {
              try {
                await state.supabaseClient.storage
                  .from(window.CONFIG.supabase.bucketName || 'gallery')
                  .remove(storagePaths);
              } catch (err) {
                console.warn('Gagal menghapus file dari storage bucket:', err);
              }
            }

            // 2. Hapus baris dari tabel gallery_photos
            const { error } = await state.supabaseClient
              .from('gallery_photos')
              .delete()
              .in('id', selectedIds);

            if (error) throw error;
          }

          // Hapus dari state lokal
          const setDeleted = new Set(selectedIds);
          state.photos = state.photos.filter((p) => !setDeleted.has(p.id));
          state.selectedPhotoIds.clear();

          savePhotosLocally();
          updatePhotoCountBadge();
          renderGallery();
          updateBatchToolbar();
          showToast(`Berhasil menghapus ${count} media sekaligus.`);
        } catch (err) {
          console.error('Gagal menghapus media massal:', err);
          alert('Gagal menghapus media: ' + (err.message || 'Terjadi kesalahan'));
        } finally {
          if (btnDelete) {
            btnDelete.disabled = state.selectedPhotoIds.size === 0;
            btnDelete.innerHTML = originalHtml;
          }
        }
      });
    }
  };

  // Hapus Media Satuan
  const confirmDeletePhoto = async (photoId) => {
    if (!state.isAdmin) return;
    const confirmAction = confirm('Apakah Anda yakin ingin menghapus media ini dari galeri?');
    if (!confirmAction) return;

    try {
      if (state.supabaseClient) {
        const photo = state.photos.find((p) => p.id === photoId);
        if (photo && photo.imageUrl) {
          const path = getStoragePathFromUrl(photo.imageUrl);
          if (path) {
            try {
              await state.supabaseClient.storage
                .from(window.CONFIG.supabase.bucketName || 'gallery')
                .remove([path]);
            } catch (err) {
              console.warn('Gagal menghapus file dari storage:', err);
            }
          }
        }

        const { error } = await state.supabaseClient
          .from('gallery_photos')
          .delete()
          .eq('id', photoId);

        if (error) throw error;
      }

      state.photos = state.photos.filter((p) => p.id !== photoId);
      state.selectedPhotoIds.delete(photoId);
      savePhotosLocally();
      updatePhotoCountBadge();
      renderGallery();
      updateBatchToolbar();
      showToast('Media berhasil dihapus.');
    } catch (err) {
      console.error('Gagal menghapus media:', err);
      alert('Gagal menghapus media: ' + err.message);
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
  setupBatchManagement();
  checkAdminAuth();
  loadPhotos();
});
