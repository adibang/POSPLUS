// ==================== FIREBASE INITIALIZATION ====================
// GANTI DENGAN KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
    apiKey: "AIzaSyCVB9Y4jLWRFsVLbnnL4-6wGcShtvozUY",
    authDomain: "populus-32429.firebaseapp.com",
    projectId: "populus-32429",
    storageBucket: "populus-32429.firebasestorage.app",
    messagingSenderId: "5210906605",
    appId: "1:5210906605:web:7a59fbf83cb0f66ac11162"
};
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// ==================== KOLEKSI FIRESTORE ====================
const collections = {
    SETTINGS: 'settings',
    KASIR_CATEGORIES: 'kasirCategories',
    KASIR_ITEMS: 'kasirItems',
    KASIR_SATUAN: 'kasirSatuan',
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    PENDING_TRANSACTIONS: 'pendingTransactions',
    SALES: 'sales',
    PURCHASES: 'purchases'
};

// ==================== FUNGSI HELPER FIRESTORE ====================
async function firebaseGetAll(collectionName) {
    const snapshot = await firestore.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function firebaseAdd(collectionName, data) {
    const docRef = await firestore.collection(collectionName).add(data);
    return docRef.id;
}

async function firebasePut(collectionName, data) {
    if (!data.id) throw new Error('Data must have an id for update');
    const { id, ...rest } = data;
    await firestore.collection(collectionName).doc(id).set(rest, { merge: true });
    return id;
}

async function firebaseDelete(collectionName, id) {
    await firestore.collection(collectionName).doc(id).delete();
}

async function firebaseGet(collectionName, id) {
    const doc = await firestore.collection(collectionName).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function firebaseSet(collectionName, id, data) {
    await firestore.collection(collectionName).doc(id).set(data);
    return id;
}

// ==================== FUNGSI UNTUK SUBMENU SIDEBAR ====================
function toggleSubMenu(header) {
    const subMenu = header.nextElementSibling;
    if (subMenu && subMenu.classList.contains('sub-menu')) {
        document.querySelectorAll('.sub-menu').forEach(sm => sm.style.display = 'none');
        document.querySelectorAll('.menu-header').forEach(h => h.classList.remove('open'));

        if (subMenu.style.display !== 'block') {
            subMenu.style.display = 'block';
            header.classList.add('open');
        } else {
            subMenu.style.display = 'none';
        }
    }
}

function closeSubMenu(button) {
    const subMenu = button.closest('.sub-menu');
    if (subMenu) {
        subMenu.style.display = 'none';
        const header = subMenu.previousElementSibling;
        if (header && header.classList.contains('menu-header')) {
            header.classList.remove('open');
        }
    }
}

function closeDrawer() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('show');
    document.querySelectorAll('.sub-menu').forEach(sm => sm.style.display = 'none');
    document.querySelectorAll('.menu-header').forEach(h => h.classList.remove('open'));
}

function toggleDrawer() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('drawer-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// ==================== AUDIO NOTIFICATION SYSTEM ====================
let audioContext = null;
let audioInitialized = false;

function initAudioSystem() {
    if (audioInitialized) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioInitialized = true;
        console.log("Audio system initialized");
        createFallbackSounds();
    } catch (error) {
        console.log("AudioContext not supported, using fallback:", error);
        createFallbackSounds();
    }
}

function createFallbackSounds() {
    const successAudio = document.getElementById('notification-success');
    if (successAudio) successAudio.src = createBeepSound(800, 0.3);
    const warningAudio = document.getElementById('notification-warning');
    if (warningAudio) warningAudio.src = createBeepSound(600, 0.2);
    const errorAudio = document.getElementById('notification-error');
    if (errorAudio) errorAudio.src = createBeepSound(400, 0.5);
    const buttonClickAudio = document.getElementById('button-click-sound');
    if (buttonClickAudio) buttonClickAudio.src = createBeepSound(600, 0.1);
}

function createBeepSound(frequency, duration) {
    const sampleRate = 44100;
    const channels = 1;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples * 2, true);
    const amplitude = 0.3;
    for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * frequency * time) * amplitude;
        const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
        view.setInt16(44 + i * 2, intSample, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}

function playClickSound() {
    try {
        if (!audioInitialized) initAudioSystem();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (audioContext && audioContext.state === 'running') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } else {
            const buttonClickAudio = document.getElementById('button-click-sound');
            if (buttonClickAudio) {
                buttonClickAudio.currentTime = 0;
                buttonClickAudio.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    } catch (error) { console.log("Click sound play failed:", error); }
}

function playSuccessSound() {
    try {
        if (!audioInitialized) initAudioSystem();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (audioContext && audioContext.state === 'running') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } else {
            const successAudio = document.getElementById('notification-success');
            if (successAudio) {
                successAudio.currentTime = 0;
                successAudio.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    } catch (error) { console.log("Sound play failed:", error); }
}

function playWarningSound() {
    try {
        if (!audioInitialized) initAudioSystem();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (audioContext && audioContext.state === 'running') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.35);
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } else {
            const warningAudio = document.getElementById('notification-warning');
            if (warningAudio) {
                warningAudio.currentTime = 0;
                warningAudio.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    } catch (error) { console.log("Warning sound failed:", error); }
}

function playErrorSound() {
    try {
        if (!audioInitialized) initAudioSystem();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        if (audioContext && audioContext.state === 'running') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 400;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } else {
            const errorAudio = document.getElementById('notification-error');
            if (errorAudio) {
                errorAudio.currentTime = 0;
                errorAudio.play().catch(e => console.log("Audio play failed:", e));
            }
        }
    } catch (error) { console.log("Error sound failed:", error); }
}

document.addEventListener('click', function initAudioOnInteraction() {
    if (!audioInitialized) {
        initAudioSystem();
        document.removeEventListener('click', initAudioOnInteraction);
    }
}, { once: true });

// ==================== GLOBAL VARIABLES ====================
let barcodeConfig = {
    flexLength: 2,
    flexValue: '02',
    productLength: 5,
    weightLength: 6
};
let receiptConfig = {
    paperWidth: 32,
    header: "TOKO LOKABUMBU\nJl. Raya No. 123\nTelp: 08123456789",
    footer: "Terima kasih\nSelamat berbelanja kembali",
    showDateTime: true,
    showTransactionNumber: true,
    showCashier: false
};
let kasirCategories = [];
let kasirItems = [];
let kasirSatuan = [];
let customers = [];
let suppliers = [];
let pendingTransactions = [];
let editingKasirCategoryId = null;
let editingKasirItemId = null;
let editingSatuanId = null;
let editingCustomerId = null;
let editingSupplierId = null;
let selectedCustomer = null;
let tempUnitConversions = [];
let editingConversionIndex = -1;
let currentFilteredItems = [];
let cart = [];
let productViewMode = 'list';
let lastTransactionData = null;

// Variabel untuk printer serial
let printerPort = null;
// Variabel untuk pembayaran kombinasi
let pendingPayments = [];
let pendingTotalPaid = 0;

// ==================== VARIABEL UNTUK LOGIN OVERLAY ====================
let loginTapCount = 0;
let appUnlocked = false;

const icons = {
    edit: `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    delete: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    add: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    upload: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    download: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
};

// ==================== FUNGSI NOTIFIKASI ====================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.backgroundColor = type === 'error' ? '#ff4444' : (type === 'warning' ? '#ffbb33' : '#006B54');
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ==================== FUNGSI UPDATE BADGE PENDING ====================
function updatePendingBadge() {
    const badge = document.getElementById('pending-badge');
    if (!badge) return;
    const count = pendingTransactions.length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ==================== SETTINGS MODAL ====================
async function exportData() {
    try {
        showLoading();
        const exportData = {
            kasirCategories: await firebaseGetAll(collections.KASIR_CATEGORIES),
            kasirItems: await firebaseGetAll(collections.KASIR_ITEMS),
            kasirSatuan: await firebaseGetAll(collections.KASIR_SATUAN),
            customers: await firebaseGetAll(collections.CUSTOMERS),
            suppliers: await firebaseGetAll(collections.SUPPLIERS),
            pendingTransactions: await firebaseGetAll(collections.PENDING_TRANSACTIONS),
            settings: await firebaseGetAll(collections.SETTINGS),
            exportDate: new Date().toISOString(),
            version: 16
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = exportFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Data berhasil dieksport!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Gagal mengeksport data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function importData() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) { resolve(false); return; }
            showLoading();
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    // Hapus semua data lama
                    const collectionsList = Object.values(collections);
                    for (const coll of collectionsList) {
                        const snapshot = await firestore.collection(coll).get();
                        const batch = firestore.batch();
                        snapshot.docs.forEach(doc => batch.delete(doc.ref));
                        await batch.commit();
                    }

                    if (importedData.kasirCategories) for (const kc of importedData.kasirCategories) {
                        const { id, ...rest } = kc;
                        await firebaseAdd(collections.KASIR_CATEGORIES, rest);
                    }
                    if (importedData.kasirItems) for (const ki of importedData.kasirItems) {
                        const { id, ...rest } = ki;
                        await firebaseAdd(collections.KASIR_ITEMS, rest);
                    }
                    if (importedData.kasirSatuan) for (const ks of importedData.kasirSatuan) {
                        const { id, ...rest } = ks;
                        await firebaseAdd(collections.KASIR_SATUAN, rest);
                    }
                    if (importedData.customers) for (const c of importedData.customers) {
                        const { id, ...rest } = c;
                        await firebaseAdd(collections.CUSTOMERS, rest);
                    }
                    if (importedData.suppliers) for (const s of importedData.suppliers) {
                        const { id, ...rest } = s;
                        await firebaseAdd(collections.SUPPLIERS, rest);
                    }
                    if (importedData.pendingTransactions) for (const pt of importedData.pendingTransactions) {
                        const { id, ...rest } = pt;
                        await firebaseAdd(collections.PENDING_TRANSACTIONS, rest);
                    }
                    if (importedData.settings) for (const set of importedData.settings) {
                        const { id, ...rest } = set;
                        await firebaseSet(collections.SETTINGS, set.key, rest);
                    }

                    await loadKasirCategories();
                    await loadKasirItems();
                    await loadKasirSatuan();
                    await loadCustomers();
                    await loadSuppliers();
                    await loadPendingTransactions();
                    showNotification('Data berhasil diimport!', 'success');
                    resolve(true);
                } catch (error) {
                    console.error('Error importing data:', error);
                    showNotification('Gagal mengimport data: ' + error.message, 'error');
                    resolve(false);
                } finally { hideLoading(); }
            };
            reader.onerror = () => { showNotification('Gagal membaca file', 'error'); hideLoading(); resolve(false); };
            reader.readAsText(file);
        };
        input.click();
    });
}

async function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data?\nTindakan ini tidak dapat dibatalkan!')) {
        try {
            showLoading();
            const collectionsList = Object.values(collections);
            for (const coll of collectionsList) {
                const snapshot = await firestore.collection(coll).get();
                const batch = firestore.batch();
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
            kasirCategories = [];
            kasirItems = [];
            kasirSatuan = [];
            customers = [];
            suppliers = [];
            pendingTransactions = [];
            updatePendingBadge();
            showNotification('Semua data berhasil dihapus!', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        } finally { hideLoading(); }
    }
}

function showSettingsModal() {
    // Update nilai di dalam settings-content dengan nilai terbaru dari receiptConfig
    const settingsContent = document.getElementById('settings-content');
    settingsContent.innerHTML = `
        <div style="margin-bottom:20px;">
            <div style="color:#333333;margin-bottom:10px;font-weight:600;font-size:1rem;display:flex;align-items:center;gap:8px;">
                <svg class="icon icon-sm" viewBox="0 0 24 24" style="color:#006B54;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Manajemen Data
            </div>
            <button style="width:100%;padding:12px;border:none;border-radius:15px;background:#006B54;color:white;font-weight:600;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #006B54;" onclick="exportData()">${icons.upload} Export Data</button>
            <button style="width:100%;padding:12px;border:none;border-radius:15px;background:#006B54;color:white;font-weight:600;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #006B54;" onclick="importData()">${icons.download} Import Data</button>
            <button style="width:100%;padding:12px;border:none;border-radius:15px;background:#ff6b6b;color:white;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #ff6b6b;" onclick="clearAllData()">${icons.delete} Hapus Semua Data</button>
        </div>
        <div style="margin-bottom:20px; border-top:1px solid #ddd; padding-top:20px;">
            <div style="color:#333333;margin-bottom:15px;font-weight:600;font-size:1rem;display:flex;align-items:center;gap:8px;">
                <svg class="icon icon-sm" viewBox="0 0 24 24" style="color:#006B54;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Konfigurasi Barcode Timbangan
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Panjang Digit Flex</label>
                <input type="number" id="barcode-flex-length" class="form-input" value="${barcodeConfig.flexLength}" min="1" max="5">
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Nilai Flex (misal 02)</label>
                <input type="text" id="barcode-flex-value" class="form-input" value="${barcodeConfig.flexValue}" maxlength="5">
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Panjang Digit Kode Item</label>
                <input type="number" id="barcode-product-length" class="form-input" value="${barcodeConfig.productLength}" min="1" max="10">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; margin-bottom:5px;">Panjang Digit Berat</label>
                <input type="number" id="barcode-weight-length" class="form-input" value="${barcodeConfig.weightLength}" min="1" max="10">
            </div>
            <div style="color:#666; font-size:0.85rem; margin-bottom:10px;">Total panjang harus 13 digit. Saat ini: <span id="total-digits-display">${barcodeConfig.flexLength + barcodeConfig.productLength + barcodeConfig.weightLength}</span></div>
            <button class="form-button-primary" style="width:100%;" onclick="saveBarcodeConfigFromUI()">Simpan Konfigurasi Barcode</button>
        </div>

        <!-- ==================== BAGIAN PENGATURAN STRUK ==================== -->
        <div style="margin-bottom:20px; border-top:1px solid #ddd; padding-top:20px;">
            <div style="color:#333333;margin-bottom:15px;font-weight:600;font-size:1rem;display:flex;align-items:center;gap:8px;">
                <svg class="icon icon-sm" viewBox="0 0 24 24" style="color:#006B54;"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="15" width="12" height="6" rx="2"/></svg> Pengaturan Struk
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Lebar Kertas (jumlah karakter)</label>
                <input type="number" id="receipt-paper-width" class="form-input" value="${receiptConfig.paperWidth}" min="20" max="80">
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Header (pisahkan baris dengan \\n)</label>
                <textarea id="receipt-header" class="form-input" rows="3">${receiptConfig.header.replace(/\n/g, '\\n')}</textarea>
                <small style="color:#666;">Gunakan \\n untuk baris baru</small>
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; margin-bottom:5px;">Footer (pisahkan baris dengan \\n)</label>
                <textarea id="receipt-footer" class="form-input" rows="3">${receiptConfig.footer.replace(/\n/g, '\\n')}</textarea>
                <small style="color:#666;">Gunakan \\n untuk baris baru</small>
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="receipt-show-datetime" ${receiptConfig.showDateTime ? 'checked' : ''}> Tampilkan Tanggal & Waktu
                </label>
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="receipt-show-transnum" ${receiptConfig.showTransactionNumber ? 'checked' : ''}> Tampilkan Nomor Transaksi
                </label>
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="receipt-show-cashier" ${receiptConfig.showCashier ? 'checked' : ''}> Tampilkan Nama Kasir
                </label>
            </div>
            <button class="form-button-primary" style="width:100%;" onclick="saveReceiptConfig()">Simpan Pengaturan Struk</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px; margin-top:20px;">
            <button class="form-button-secondary" onclick="closeSettingsModal()"><svg class="icon icon-sm" viewBox="0 0 24 24" style="color:#333333;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> TUTUP</button>
        </div>
    `;
    // Event listener untuk update total digit barcode
    const flexLen = document.getElementById('barcode-flex-length');
    const prodLen = document.getElementById('barcode-product-length');
    const weightLen = document.getElementById('barcode-weight-length');
    const totalSpan = document.getElementById('total-digits-display');
    function updateTotal() {
        const total = (parseInt(flexLen.value) || 0) + (parseInt(prodLen.value) || 0) + (parseInt(weightLen.value) || 0);
        totalSpan.textContent = total;
        totalSpan.style.color = total === 13 ? 'green' : 'red';
    }
    flexLen.addEventListener('input', updateTotal);
    prodLen.addEventListener('input', updateTotal);
    weightLen.addEventListener('input', updateTotal);
    document.getElementById('settings-modal').style.display = 'flex';
    closeDrawer();
}

async function saveBarcodeConfigFromUI() {
    const flexLength = parseInt(document.getElementById('barcode-flex-length').value);
    const flexValue = document.getElementById('barcode-flex-value').value.trim();
    const productLength = parseInt(document.getElementById('barcode-product-length').value);
    const weightLength = parseInt(document.getElementById('barcode-weight-length').value);

    if (isNaN(flexLength) || flexLength < 1) { showNotification('Panjang Flex harus angka positif', 'error'); return; }
    if (!flexValue) { showNotification('Nilai Flex harus diisi', 'error'); return; }
    if (isNaN(productLength) || productLength < 1) { showNotification('Panjang Kode Item harus angka positif', 'error'); return; }
    if (isNaN(weightLength) || weightLength < 1) { showNotification('Panjang Berat harus angka positif', 'error'); return; }

    const total = flexLength + productLength + weightLength;
    if (total !== 13) {
        showNotification(`Total panjang harus 13 digit, saat ini ${total}`, 'error');
        return;
    }

    const newConfig = { flexLength, flexValue, productLength, weightLength };
    try {
        showLoading();
        await firebaseSet(collections.SETTINGS, 'barcodeConfig', newConfig);
        barcodeConfig = newConfig;
        showNotification('Konfigurasi barcode tersimpan', 'success');
        closeSettingsModal();
    } catch (error) {
        showNotification('Gagal menyimpan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

// ==================== LOCALSTORAGE CART ====================
const CART_STORAGE_KEY = 'pos_cart';
const CUSTOMER_STORAGE_KEY = 'pos_selected_customer';

function saveCartToLocalStorage() {
    try {
        const cartData = cart.map(c => ({
            itemId: c.item.id,
            qty: c.qty,
            unitConversion: c.unitConversion ? { 
                unit: c.unitConversion.unit, 
                value: c.unitConversion.value,
                barcode: c.unitConversion.barcode,
                sellPrice: c.unitConversion.sellPrice 
            } : null,
            weightGram: c.weightGram || 0,
            pricePerUnit: c.pricePerUnit,
            subtotal: c.subtotal,
            isOutstanding: c.isOutstanding || false,
            customerId: c.customerId
        }));
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
        
        if (selectedCustomer) {
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({
                id: selectedCustomer.id,
                name: selectedCustomer.name
            }));
        } else {
            localStorage.removeItem(CUSTOMER_STORAGE_KEY);
        }
    } catch (e) {
        console.error('Gagal menyimpan cart ke localStorage:', e);
    }
}

async function loadCartFromLocalStorage() {
    try {
        const customerData = localStorage.getItem(CUSTOMER_STORAGE_KEY);
        if (customerData) {
            const { id } = JSON.parse(customerData);
            const customer = customers.find(c => c.id === id);
            if (customer) {
                selectedCustomer = customer;
                const badge = document.getElementById('customer-badge');
                if (badge) {
                    badge.textContent = customer.name.charAt(0).toUpperCase();
                    badge.style.display = 'flex';
                }
            } else {
                localStorage.removeItem(CUSTOMER_STORAGE_KEY);
            }
        }

        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartData) return;

        const parsed = JSON.parse(cartData);
        if (!Array.isArray(parsed)) return;

        const newCart = [];
        for (let c of parsed) {
            if (c.isOutstanding) {
                const cust = customers.find(cust => cust.id === c.customerId);
                if (cust) {
                    const item = {
                        id: 'outstanding-' + cust.id,
                        name: 'Piutang ' + cust.name,
                        stock: Infinity
                    };
                    newCart.push({
                        item: item,
                        qty: c.qty,
                        unitConversion: null,
                        weightGram: 0,
                        pricePerUnit: c.pricePerUnit,
                        subtotal: c.subtotal,
                        isOutstanding: true,
                        customerId: cust.id
                    });
                } else {
                    console.warn('Customer tidak ditemukan untuk item piutang');
                }
                continue;
            }

            const item = kasirItems.find(i => i.id === c.itemId);
            if (!item) continue;

            let pricePerUnit;
            if (c.unitConversion) {
                const conv = item.unitConversions?.find(u => u.barcode === c.unitConversion.barcode);
                if (conv) {
                    pricePerUnit = conv.sellPrice;
                    c.unitConversion = conv;
                } else {
                    pricePerUnit = getPriceForQty(item, c.qty);
                    c.unitConversion = null;
                }
            } else {
                pricePerUnit = getPriceForQty(item, c.qty);
            }

            newCart.push({
                item,
                qty: c.qty,
                unitConversion: c.unitConversion || null,
                weightGram: c.weightGram || 0,
                pricePerUnit,
                subtotal: c.qty * pricePerUnit
            });
        }

        cart = newCart;
        renderCartPage();
        if (document.getElementById('transaksi-page').style.display === 'block') {
            renderProductList();
        }
    } catch (e) {
        console.error('Gagal memuat cart dari localStorage:', e);
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
}

// ==================== LOADING STATE FUNCTIONS ====================
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

function showError(message) {
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const mainContent = document.querySelector('.main-content');
    if (errorState && errorMessage) {
        errorMessage.textContent = message;
        errorState.style.display = 'block';
    }
    if (mainContent) mainContent.style.display = 'none';
}

function hideError() {
    const errorState = document.getElementById('error-state');
    const mainContent = document.querySelector('.main-content');
    if (errorState) errorState.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

// ==================== LOAD DATA DARI FIRESTORE ====================
async function loadBarcodeConfig() {
    try {
        const doc = await firestore.collection(collections.SETTINGS).doc('barcodeConfig').get();
        if (doc.exists) {
            barcodeConfig = doc.data();
        } else {
            barcodeConfig = { flexLength: 2, flexValue: '02', productLength: 5, weightLength: 6 };
        }
    } catch (error) {
        console.error('Error loading barcode config:', error);
        barcodeConfig = { flexLength: 2, flexValue: '02', productLength: 5, weightLength: 6 };
    }
}

async function loadReceiptConfig() {
    try {
        const doc = await firestore.collection(collections.SETTINGS).doc('receiptConfig').get();
        if (doc.exists) {
            receiptConfig = doc.data();
        } else {
            receiptConfig = {
                paperWidth: 32,
                header: "TOKO LOKABUMBU\nJl. Raya No. 123\nTelp: 08123456789",
                footer: "Terima kasih\nSelamat berbelanja kembali",
                showDateTime: true,
                showTransactionNumber: true,
                showCashier: false
            };
        }
    } catch (error) {
        console.error('Error loading receipt config:', error);
        receiptConfig = {
            paperWidth: 32,
            header: "TOKO LOKABUMBU\nJl. Raya No. 123\nTelp: 08123456789",
            footer: "Terima kasih\nSelamat berbelanja kembali",
            showDateTime: true,
            showTransactionNumber: true,
            showCashier: false
        };
    }
}

async function saveReceiptConfig() {
    const paperWidth = parseInt(document.getElementById('receipt-paper-width').value);
    if (isNaN(paperWidth) || paperWidth < 10) {
        showNotification('Lebar kertas minimal 10 karakter', 'error');
        return;
    }

    const headerRaw = document.getElementById('receipt-header').value;
    const footerRaw = document.getElementById('receipt-footer').value;
    const header = headerRaw.replace(/\\n/g, '\n');
    const footer = footerRaw.replace(/\\n/g, '\n');

    const showDateTime = document.getElementById('receipt-show-datetime').checked;
    const showTransactionNumber = document.getElementById('receipt-show-transnum').checked;
    const showCashier = document.getElementById('receipt-show-cashier').checked;

    const newConfig = {
        paperWidth,
        header,
        footer,
        showDateTime,
        showTransactionNumber,
        showCashier
    };

    try {
        showLoading();
        await firebaseSet(collections.SETTINGS, 'receiptConfig', newConfig);
        receiptConfig = newConfig;
        showNotification('Pengaturan struk tersimpan', 'success');
        closeSettingsModal();
    } catch (error) {
        showNotification('Gagal menyimpan: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadKasirCategories() {
    try { 
        kasirCategories = await firebaseGetAll(collections.KASIR_CATEGORIES); 
        kasirCategories.sort((a,b) => a.name.localeCompare(b.name)); 
    } catch (error) { console.error('Error loading kasir categories:', error); kasirCategories = []; }
}

async function loadKasirItems() {
    try { 
        kasirItems = await firebaseGetAll(collections.KASIR_ITEMS); 
        kasirItems.forEach(item => { if (item.stock === undefined) item.stock = 0; });
        kasirItems.sort((a,b) => a.name.localeCompare(b.name)); 
    } catch (error) { console.error('Error loading kasir items:', error); kasirItems = []; }
}

async function loadKasirSatuan() {
    try { 
        kasirSatuan = await firebaseGetAll(collections.KASIR_SATUAN); 
        kasirSatuan.sort((a,b) => a.name.localeCompare(b.name)); 
    } catch (error) { console.error('Error loading satuan:', error); kasirSatuan = []; }
}

async function loadCustomers() {
    try { 
        customers = await firebaseGetAll(collections.CUSTOMERS); 
        customers.forEach(c => { if (c.outstanding === undefined) c.outstanding = 0; });
        customers.sort((a,b) => a.name.localeCompare(b.name)); 
    } catch (error) { console.error('Error loading customers:', error); customers = []; }
}

async function loadSuppliers() {
    try { 
        suppliers = await firebaseGetAll(collections.SUPPLIERS); 
        suppliers.sort((a,b) => a.name.localeCompare(b.name)); 
    } catch (error) { console.error('Error loading suppliers:', error); suppliers = []; }
}

async function loadPendingTransactions() {
    try { 
        pendingTransactions = await firebaseGetAll(collections.PENDING_TRANSACTIONS); 
        updatePendingBadge();
    } catch (error) { 
        console.error('Error loading pending transactions:', error); 
        pendingTransactions = []; 
        updatePendingBadge();
    }
}

async function savePendingTransaction(transactionData) {
    try {
        const now = new Date().toISOString();
        const data = { ...transactionData, createdAt: now };
        const id = await firebaseAdd(collections.PENDING_TRANSACTIONS, data);
        data.id = id;
        pendingTransactions.push(data);
        updatePendingBadge();
        return data;
    } catch (error) {
        console.error('Error saving pending transaction:', error);
        throw error;
    }
}

async function deletePendingTransaction(id) {
    try {
        await firebaseDelete(collections.PENDING_TRANSACTIONS, id);
        pendingTransactions = pendingTransactions.filter(t => t.id !== id);
        updatePendingBadge();
    } catch (error) {
        console.error('Error deleting pending transaction:', error);
        throw error;
    }
}

// ==================== FUNGSI UNTUK CEK DAN SET STATUS UNLOCKED (localStorage) ====================
function checkUnlockedStatus() {
    // Langsung baca dari localStorage
    const unlocked = localStorage.getItem('appUnlocked') === 'true';
    appUnlocked = unlocked;
    return unlocked;
}

function setAppUnlocked() {
    localStorage.setItem('appUnlocked', 'true');
    appUnlocked = true;
    console.log('App unlocked status saved to localStorage');
}

// ==================== FUNGSI UNTUK MENAMPILKAN LOGIN OVERLAY ====================
function showLoginScreen() {
    const overlay = document.getElementById('login-overlay');
    overlay.style.display = 'flex';
    loginTapCount = 0;

    overlay.addEventListener('click', function tapHandler(e) {
        const target = e.target;
        if (target.id === 'login-username' || target.id === 'login-password' || target.id === 'login-btn') {
            return;
        }
        loginTapCount++;
        if (loginTapCount >= 20) {
            overlay.removeEventListener('click', tapHandler);
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                setAppUnlocked(); // Simpan ke localStorage
            }, 500);
        }
    });

    document.getElementById('login-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('login-error').style.display = 'block';
        setTimeout(() => {
            document.getElementById('login-error').style.display = 'none';
        }, 2000);
    });
}

// ==================== FUNGSI TRANSAKSI KASIR (HALAMAN PRODUK) ====================
function openTransaksiPage() {
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('transaksi-page').style.display = 'block';
    document.getElementById('cart-page').style.display = 'none';
    document.getElementById('payment-page').style.display = 'none';
    
    currentFilteredItems = [...kasirItems];
    renderProductList(currentFilteredItems);
    document.getElementById('barcode-input').value = '';
    
    renderCartPage();
    updatePiutangButtonCart();
    setTimeout(() => document.getElementById('barcode-input').focus(), 100);
    closeDrawer();
}

function closeTransaksiPage() {
    document.getElementById('transaksi-page').style.display = 'none';
    document.querySelector('.main-content').style.display = 'block';
}

function getPriceForQty(item, qty) {
    if (!item.priceLevels || item.priceLevels.length === 0) {
        return item.hargaJual;
    }
    const sorted = [...item.priceLevels].sort((a, b) => b.minQty - a.minQty);
    for (let level of sorted) {
        if (qty >= level.minQty) {
            return level.price;
        }
    }
    return item.hargaJual;
}

function addToCart(item, qty, unitConversion, weightGram) {
    let requiredStock;
    if (weightGram > 0) {
        requiredStock = qty;
    } else if (unitConversion) {
        requiredStock = qty * unitConversion.value;
    } else {
        requiredStock = qty;
    }
    
    if (item.stock < requiredStock) {
        showNotification(`Stok ${item.name} tidak cukup. Tersedia: ${item.stock}`, 'error');
        return;
    }
    
    let pricePerUnit;
    if (unitConversion) {
        pricePerUnit = unitConversion.sellPrice;
    } else if (weightGram > 0) {
        pricePerUnit = getPriceForQty(item, qty);
    } else {
        pricePerUnit = getPriceForQty(item, qty);
    }

    const existingIndex = cart.findIndex(c => 
        c.item.id === item.id && 
        c.unitConversion?.barcode === unitConversion?.barcode &&
        c.weightGram === weightGram
    );

    if (existingIndex >= 0) {
        const existing = cart[existingIndex];
        const newQty = existing.qty + qty;

        let newPricePerUnit;
        if (unitConversion) {
            newPricePerUnit = unitConversion.sellPrice;
        } else if (weightGram > 0) {
            newPricePerUnit = getPriceForQty(item, newQty);
        } else {
            newPricePerUnit = getPriceForQty(item, newQty);
        }

        existing.qty = newQty;
        existing.pricePerUnit = newPricePerUnit;
        existing.subtotal = newQty * newPricePerUnit;
    } else {
        cart.push({
            item,
            qty,
            unitConversion,
            weightGram,
            pricePerUnit,
            subtotal: qty * pricePerUnit
        });
    }
    renderCartPage();
    saveCartToLocalStorage();
}

function processBarcode() {
    const input = document.getElementById('barcode-input');
    const barcode = input.value.trim();
    if (!barcode) return;

    console.log('Processing barcode:', barcode);

    // 1. Cari berdasarkan kode item atau barcode item
    let item = kasirItems.find(i => i.code === barcode || i.barcode === barcode);
    if (item) {
        addToCart(item, 1, null, 0);
        input.value = '';
        filterProductList('');
        return;
    }

    // 2. Cari berdasarkan barcode satuan (unitConversions)
    for (let it of kasirItems) {
        if (it.unitConversions && Array.isArray(it.unitConversions)) {
            const conv = it.unitConversions.find(c => c.barcode === barcode);
            if (conv) {
                addToCart(it, 1, conv, 0);
                input.value = '';
                filterProductList('');
                return;
            }
        }
    }

    // 3. Cek apakah ini barcode timbangan (13 digit)
    if (barcode.length === 13) {
        const flex = barcode.substr(0, barcodeConfig.flexLength);
        if (flex !== barcodeConfig.flexValue) {
            showNotification('Barcode tidak dikenal (flex tidak cocok)', 'error');
            input.value = '';
            filterProductList('');
            return;
        }

        const productCode = barcode.substr(barcodeConfig.flexLength, barcodeConfig.productLength);
        const weightStr = barcode.substr(barcodeConfig.flexLength + barcodeConfig.productLength, barcodeConfig.weightLength);
        const weightGram = parseInt(weightStr, 10);

        if (!isNaN(weightGram) && weightGram > 0) {
            item = kasirItems.find(i => i.code === productCode && i.isWeighable === true);
            if (item) {
                const qtyKg = weightGram / 1000;
                addToCart(item, qtyKg, null, weightGram);
                input.value = '';
                filterProductList('');
                return;
            } else {
                showNotification('Produk dengan kode ' + productCode + ' tidak ditemukan atau bukan produk timbangan', 'error');
                input.value = '';
                filterProductList('');
                return;
            }
        }
    }

    // 4. Jika tidak ditemukan sama sekali
    showNotification('Produk tidak ditemukan', 'error');
    input.value = '';
    filterProductList('');
}

// ==================== FUNGSI PILIH CUSTOMER ====================
function openSelectCustomerModal() {
    const modal = document.getElementById('select-customer-modal');
    renderCustomerListForSelect();
    modal.style.display = 'flex';
    closeDrawer();
}

function closeSelectCustomerModal() {
    document.getElementById('select-customer-modal').style.display = 'none';
}

function renderCustomerListForSelect() {
    const container = document.getElementById('select-customer-list');
    if (!container) return;

    if (!customers || customers.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px;">Belum ada pelanggan. <br><button class="form-button-primary" onclick="openTambahCustomerModal(); closeSelectCustomerModal();">Tambah Pelanggan</button></div>';
        return;
    }

    let html = '';
    customers.forEach(cust => {
        html += `
            <div class="customer-select-item" onclick="selectCustomer('${cust.id}')" style="padding:15px; border-bottom:1px solid #eee; cursor:pointer; hover:background:#f5f5f5;">
                <strong>${cust.name}</strong><br>
                <span style="font-size:0.9rem;">Piutang: ${formatRupiah(cust.outstanding || 0)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function selectCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        selectedCustomer = customer;
        const badge = document.getElementById('customer-badge');
        if (badge) {
            badge.textContent = customer.name.charAt(0).toUpperCase();
            badge.style.display = 'flex';
        }
        try {
            localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({
                id: customer.id,
                name: customer.name
            }));
        } catch (e) {}
        showNotification(`Pelanggan ${customer.name} dipilih`, 'success');
        updatePiutangButtonCart();
    }
    closeSelectCustomerModal();
}

function openCartPage() {
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('transaksi-page').style.display = 'none';
    document.getElementById('cart-page').style.display = 'block';
    document.getElementById('payment-page').style.display = 'none';
    renderCartPage();
    updatePiutangButtonCart();
}

function closeCartPage() {
    document.getElementById('cart-page').style.display = 'none';
    document.getElementById('transaksi-page').style.display = 'block';
}

function renderCartPage() {
    const tbody = document.getElementById('cart-items-page');
    const totalEl = document.getElementById('cart-total-page');
    const cartCount = document.getElementById('cart-count');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0;
    cart.forEach((c, idx) => {
        const row = document.createElement('tr');
        const nama = c.item.name;
        let satuanTeks = '';
        if (c.unitConversion) {
            const unitName = kasirSatuan.find(s => s.id == c.unitConversion.unit)?.name || '?';
            satuanTeks = `${unitName} (${c.qty})`;
        } else if (c.weightGram > 0) {
            satuanTeks = `${c.weightGram} g (${c.qty.toFixed(3)} kg)`;
        } else {
            satuanTeks = `${c.qty}`;
        }
        const hargaSatuan = formatRupiah(c.pricePerUnit);
        const subtotalStr = formatRupiah(c.subtotal);
        row.innerHTML = `
            <td>${nama}</td>
            <td>${satuanTeks}</td>
            <td>${hargaSatuan}</td>
            <td>${subtotalStr}</td>
            <td><button class="action-btn delete-btn" onclick="removeFromCart(${idx})">${icons.delete}</button></td>
        `;
        tbody.appendChild(row);
        total += c.subtotal;
    });
    totalEl.textContent = formatRupiah(total);
    cartCount.textContent = cart.length;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCartPage();
    saveCartToLocalStorage();
    if (document.getElementById('payment-page').style.display === 'block') {
        const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
        document.getElementById('payment-total').textContent = formatRupiah(total);
        updatePaymentSummary();
    }
}

function formatRupiah(angka) {
    return 'Rp ' + angka.toLocaleString('id-ID');
}

// ==================== FUNGSI PIUTANG ====================
function updatePiutangButtonCart() {
    const btn = document.getElementById('piutang-btn-cart');
    if (!btn) return;
    if (selectedCustomer && selectedCustomer.outstanding > 0) {
        btn.classList.add('active');
        btn.style.background = '#dc3545';
    } else {
        btn.classList.remove('active');
        btn.style.background = '#ccc';
    }
}

function addOutstandingToCart() {
    if (!selectedCustomer || selectedCustomer.outstanding <= 0) {
        showNotification('Tidak ada piutang untuk ditambahkan', 'warning');
        return;
    }
    const existing = cart.find(c => c.isOutstanding === true);
    if (existing) {
        showNotification('Piutang sudah ada di keranjang', 'info');
        return;
    }
    const outstandingItem = {
        item: {
            id: 'outstanding-' + selectedCustomer.id,
            name: 'Piutang ' + selectedCustomer.name,
            stock: Infinity
        },
        qty: 1,
        pricePerUnit: selectedCustomer.outstanding,
        subtotal: selectedCustomer.outstanding,
        isOutstanding: true,
        customerId: selectedCustomer.id
    };
    cart.push(outstandingItem);
    renderCartPage();
    saveCartToLocalStorage();
    updatePiutangButtonCart();
    showNotification('Piutang ditambahkan ke keranjang', 'success');
}

// ==================== FUNGSI PEMBAYARAN (MODIFIKASI) ====================
function openPaymentPage() {
    if (cart.length === 0) {
        showNotification('Keranjang masih kosong', 'warning');
        return;
    }
    document.getElementById('cart-page').style.display = 'none';
    document.getElementById('payment-page').style.display = 'block';

    document.getElementById('payment-cash').value = '0';
    document.getElementById('payment-card').value = '0';
    document.getElementById('payment-transfer').value = '0';
    document.getElementById('payment-ewallet').value = '0';

    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
    document.getElementById('payment-total').textContent = formatRupiah(total);
    updatePaymentSummary();
}

function closePaymentPage() {
    document.getElementById('payment-page').style.display = 'none';
    document.getElementById('cart-page').style.display = 'block';
}

function updatePaymentSummary() {
    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
    const cash = parseFloat(document.getElementById('payment-cash').value) || 0;
    const card = parseFloat(document.getElementById('payment-card').value) || 0;
    const transfer = parseFloat(document.getElementById('payment-transfer').value) || 0;
    const ewallet = parseFloat(document.getElementById('payment-ewallet').value) || 0;
    const paidTotal = cash + card + transfer + ewallet;

    document.getElementById('payment-grand-total').textContent = formatRupiah(paidTotal);

    const change = paidTotal - total;
    const changeEl = document.getElementById('change-amount');
    const shortageEl = document.getElementById('shortage-display');
    const shortageAmount = document.getElementById('shortage-amount');

    if (change >= 0) {
        changeEl.textContent = `Kembalian: ${formatRupiah(change)}`;
        changeEl.style.color = '#006B54';
        shortageEl.style.display = 'none';
    } else {
        changeEl.textContent = `Kembalian: Rp 0`;
        changeEl.style.color = 'red';
        shortageEl.style.display = 'block';
        shortageAmount.textContent = formatRupiah(total - paidTotal);
    }
}

async function processPayment() {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
    const cash = parseFloat(document.getElementById('payment-cash').value) || 0;
    const card = parseFloat(document.getElementById('payment-card').value) || 0;
    const transfer = parseFloat(document.getElementById('payment-transfer').value) || 0;
    const ewallet = parseFloat(document.getElementById('payment-ewallet').value) || 0;

    const paidTotal = cash + card + transfer + ewallet;
    const shortage = total - paidTotal;

    if (shortage > 0) {
        if (!selectedCustomer) {
            showNotification('Untuk mencatat piutang, harus pilih pelanggan terlebih dahulu', 'error');
            return;
        }
        pendingPayments = [
            { method: 'cash', amount: cash },
            { method: 'card', amount: card },
            { method: 'transfer', amount: transfer },
            { method: 'ewallet', amount: ewallet }
        ].filter(p => p.amount > 0);
        pendingTotalPaid = paidTotal;

        document.getElementById('shortage-confirm').textContent = formatRupiah(shortage);
        document.getElementById('confirm-piutang-modal').style.display = 'flex';
        return;
    }

    await executePayment(paidTotal, 0);
}

async function processPaymentWithPiutang() {
    closeConfirmPiutangModal();
    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
    const shortage = total - pendingTotalPaid;
    await executePayment(pendingTotalPaid, shortage);
}

async function executePayment(paidTotal, outstandingAdded) {
    try {
        showLoading();
        // Kurangi stok untuk item non-piutang
        for (let c of cart) {
            if (c.isOutstanding) continue;
            let requiredStock;
            if (c.weightGram > 0) requiredStock = c.qty;
            else if (c.unitConversion) requiredStock = c.qty * c.unitConversion.value;
            else requiredStock = c.qty;
            const item = kasirItems.find(i => i.id === c.item.id);
            if (item) {
                item.stock -= requiredStock;
                item.updatedAt = new Date().toISOString();
                await firebasePut(collections.KASIR_ITEMS, item);
            }
        }

        // Proses pembayaran piutang
        for (let c of cart) {
            if (c.isOutstanding) {
                const custId = c.customerId;
                if (!custId) {
                    showNotification('Item piutang tidak memiliki customerId', 'warning');
                    continue;
                }
                const cust = customers.find(cust => cust.id === custId);
                if (!cust) {
                    showNotification(`Customer dengan ID ${custId} tidak ditemukan`, 'warning');
                    continue;
                }
                const paymentAmount = c.subtotal;
                if (cust.outstanding >= paymentAmount) {
                    cust.outstanding -= paymentAmount;
                } else {
                    cust.outstanding = 0;
                    showNotification(`Outstanding customer ${cust.name} lebih kecil dari pembayaran, diset 0`, 'warning');
                }
                cust.updatedAt = new Date().toISOString();
                await firebasePut(collections.CUSTOMERS, cust);

                if (selectedCustomer && selectedCustomer.id === custId) {
                    selectedCustomer.outstanding = cust.outstanding;
                    const badge = document.getElementById('customer-badge');
                    if (badge) {
                        badge.textContent = selectedCustomer.name.charAt(0).toUpperCase();
                        badge.style.display = 'flex';
                    }
                }
            }
        }

        // Tambah piutang baru ke customer jika ada outstandingAdded
        if (outstandingAdded > 0 && selectedCustomer) {
            const cust = customers.find(c => c.id === selectedCustomer.id);
            if (cust) {
                cust.outstanding = (cust.outstanding || 0) + outstandingAdded;
                cust.updatedAt = new Date().toISOString();
                await firebasePut(collections.CUSTOMERS, cust);
                selectedCustomer.outstanding = cust.outstanding;
            }
        }

        const cash = parseFloat(document.getElementById('payment-cash').value) || 0;
        const card = parseFloat(document.getElementById('payment-card').value) || 0;
        const transfer = parseFloat(document.getElementById('payment-transfer').value) || 0;
        const ewallet = parseFloat(document.getElementById('payment-ewallet').value) || 0;
        const payments = [];
        if (cash > 0) payments.push({ method: 'cash', amount: cash });
        if (card > 0) payments.push({ method: 'card', amount: card });
        if (transfer > 0) payments.push({ method: 'transfer', amount: transfer });
        if (ewallet > 0) payments.push({ method: 'ewallet', amount: ewallet });

        const transactionNumber = await generateTransactionNumber();

        const subtotal = cart.reduce((sum, c) => sum + c.subtotal, 0);
        const discount = 0;
        const tax = 0;
        const total = subtotal - discount + tax;
        const change = paidTotal - total;

        const items = cart.map(c => {
            let costPerUnit = 0;
            if (!c.isOutstanding) {
                if (c.unitConversion && c.unitConversion.basePrice !== undefined) {
                    costPerUnit = c.unitConversion.basePrice;
                } else if (c.item.hargaDasar !== undefined) {
                    costPerUnit = c.item.hargaDasar;
                }
            }
            return {
                itemId: c.item.id,
                itemName: c.item.name,
                qty: c.qty,
                pricePerUnit: c.pricePerUnit,
                subtotal: c.subtotal,
                unitConversion: c.unitConversion ? { id: c.unitConversion.unit, name: kasirSatuan.find(s => s.id == c.unitConversion.unit)?.name } : null,
                weightGram: c.weightGram || 0,
                cost: costPerUnit
            };
        });

        const salesData = {
            transactionNumber,
            date: new Date().toISOString(),
            items,
            subtotal,
            discount,
            tax,
            total,
            payments,
            paidTotal,
            change,
            outstandingAdded,
            customerId: selectedCustomer ? selectedCustomer.id : null,
            customerName: selectedCustomer ? selectedCustomer.name : null
        };

        await firebaseAdd(collections.SALES, salesData);

        lastTransactionData = {
            items: cart.map(c => ({
                name: c.item.name,
                qty: c.qty,
                unit: c.unitConversion ? (kasirSatuan.find(s => s.id == c.unitConversion.unit)?.name || '?') : (c.weightGram ? 'kg' : 'pcs'),
                price: c.pricePerUnit,
                subtotal: c.subtotal
            })),
            total: total,
            paidAmount: paidTotal,
            change: change,
            date: new Date().toLocaleString('id-ID'),
            transactionNumber: transactionNumber
        };

        await loadKasirItems();
        await loadCustomers();
        renderProductList();
        showNotification(`Pembayaran berhasil (${payments.map(p => p.method).join(', ')})${outstandingAdded>0 ? ' (dengan piutang)' : ''}`, 'success');
        
        document.getElementById('print-receipt-btn').disabled = false;
        
        cart = [];
        selectedCustomer = null;
        document.getElementById('customer-badge').style.display = 'none';
        renderCartPage();
        saveCartToLocalStorage();
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Gagal memproses pembayaran: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closeConfirmPiutangModal() {
    document.getElementById('confirm-piutang-modal').style.display = 'none';
    pendingPayments = [];
    pendingTotalPaid = 0;
}

// ==================== FUNGSI PRINT VIA WEB SERIAL ====================
function wrapText(text, maxWidth) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let word of words) {
        if (word.length > maxWidth) {
            if (currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = '';
            }
            for (let i = 0; i < word.length; i += maxWidth) {
                lines.push(word.substr(i, maxWidth));
            }
        } else {
            if (currentLine.length + word.length + 1 > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                if (currentLine.length === 0) {
                    currentLine = word;
                } else {
                    currentLine += ' ' + word;
                }
            }
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }
    return lines;
}

async function printReceipt() {
    if (!printerPort) {
        showNotification('Printer belum terhubung', 'error');
        return;
    }

    let dataToPrint = lastTransactionData;
    if (!dataToPrint) {
        if (cart.length === 0) {
            showNotification('Tidak ada data untuk dicetak', 'warning');
            return;
        }
        const total = cart.reduce((s, c) => s + c.subtotal, 0);
        dataToPrint = {
            items: cart.map(c => ({
                name: c.item.name,
                qty: c.qty,
                unit: c.unitConversion ? (kasirSatuan.find(s => s.id == c.unitConversion.unit)?.name || '?') : (c.weightGram ? 'kg' : 'pcs'),
                price: c.pricePerUnit,
                subtotal: c.subtotal
            })),
            total: total,
            paidAmount: total,
            change: 0,
            date: new Date().toLocaleString('id-ID'),
            transactionNumber: 'DRAFT'
        };
    }

    const { paperWidth, header, footer, showDateTime, showTransactionNumber, showCashier } = receiptConfig;

    try {
        const writer = printerPort.writable.getWriter();
        const encoder = new TextEncoder();
        let receipt = '\n';

        const headerLines = header.split('\n');
        headerLines.forEach(line => {
            const wrapped = wrapText(line, paperWidth);
            wrapped.forEach(l => {
                receipt += l.padEnd(paperWidth) + '\n';
            });
        });
        receipt += '='.repeat(paperWidth) + '\n';

        if (showDateTime) {
            receipt += `Tanggal: ${new Date().toLocaleString('id-ID')}\n`;
        }
        if (showTransactionNumber && dataToPrint.transactionNumber) {
            receipt += `No.    : ${dataToPrint.transactionNumber}\n`;
        }
        if (showCashier) {
            receipt += `Kasir  : Admin\n`;
        }
        receipt += '-'.repeat(paperWidth) + '\n';

        dataToPrint.items.forEach(item => {
            const nameWrapped = wrapText(item.name, paperWidth - 5);
            nameWrapped.forEach((line, idx) => {
                if (idx === 0) {
                    receipt += line + '\n';
                } else {
                    receipt += '     ' + line + '\n';
                }
            });
            const qtyStr = `${item.qty} ${item.unit} x ${formatRupiah(item.price)}`;
            const subtotalStr = formatRupiah(item.subtotal);
            const line = qtyStr + ' '.repeat(Math.max(1, paperWidth - qtyStr.length - subtotalStr.length)) + subtotalStr;
            receipt += line + '\n';
        });

        receipt += '-'.repeat(paperWidth) + '\n';

        const totalLabel = 'Total';
        const totalVal = formatRupiah(dataToPrint.total);
        receipt += totalLabel + ' '.repeat(paperWidth - totalLabel.length - totalVal.length) + totalVal + '\n';

        const paidLabel = 'Bayar';
        const paidVal = formatRupiah(dataToPrint.paidAmount);
        receipt += paidLabel + ' '.repeat(paperWidth - paidLabel.length - paidVal.length) + paidVal + '\n';

        const changeLabel = 'Kembali';
        const changeVal = formatRupiah(dataToPrint.change);
        receipt += changeLabel + ' '.repeat(paperWidth - changeLabel.length - changeVal.length) + changeVal + '\n';

        receipt += '='.repeat(paperWidth) + '\n';

        const footerLines = footer.split('\n');
        footerLines.forEach(line => {
            const wrapped = wrapText(line, paperWidth);
            wrapped.forEach(l => {
                receipt += l.padEnd(paperWidth) + '\n';
            });
        });

        receipt += '\n\n\n';

        await writer.write(encoder.encode(receipt));
        writer.releaseLock();
        showNotification('Struk berhasil dicetak', 'success');
    } catch (error) {
        console.error('Error printing:', error);
        showNotification('Gagal mencetak: ' + error.message, 'error');
    }
}

async function togglePrinter() {
    if (printerPort) {
        try {
            await printerPort.close();
            printerPort = null;
            updatePrinterStatus(false);
            showNotification('Printer diputuskan', 'info');
        } catch (error) {
            console.error('Error disconnecting printer:', error);
            showNotification('Gagal memutuskan printer: ' + error.message, 'error');
        }
    } else {
        if (!navigator.serial) {
            showNotification('Web Serial API tidak didukung di browser ini. Gunakan Chrome/Edge.', 'error');
            return;
        }
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            printerPort = port;
            updatePrinterStatus(true);
            showNotification('Printer terhubung', 'success');
        } catch (error) {
            console.error('Error connecting printer:', error);
            showNotification('Gagal connect printer: ' + error.message, 'error');
        }
    }
}

function updatePrinterStatus(connected) {
    const statusLight = document.getElementById('printer-status-light');
    const statusText = document.getElementById('printer-status-text');
    const connectBtnText = document.getElementById('connect-btn-text');
    if (connected) {
        statusLight.classList.add('connected');
        statusText.textContent = '';
        connectBtnText.textContent = 'Disconnect';
    } else {
        statusLight.classList.remove('connected');
        statusText.textContent = '';
        connectBtnText.textContent = 'Connect';
    }
}

async function autoReconnectPrinter() {
    if (!navigator.serial) return;
    try {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
            const port = ports[0];
            await port.open({ baudRate: 9600 });
            printerPort = port;
            updatePrinterStatus(true);
            console.log('Printer auto-connected');
        }
    } catch (error) {
        console.warn('Auto reconnect printer failed:', error);
    }
}

// ==================== FUNGSI INVENTORY ====================
function openInventoryStokModal() {
    document.getElementById('inventory-modal-title').innerHTML = `
        <svg class="icon icon-primary" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
        </svg> Stok Barang`;

    let html = `
        <div>
            <input type="text" id="inventory-search-input" class="form-input" 
                   placeholder="Cari item..." style="margin-bottom:10px;" 
                   oninput="filterInventoryTable(this.value)">
            <div id="inventory-table-container"></div>
            <div style="margin-top:20px;">
                <button class="form-button-secondary" onclick="closeInventoryModal()">Tutup</button>
            </div>
        </div>
    `;

    document.getElementById('inventory-modal-body').innerHTML = html;
    filterInventoryTable('');
    document.getElementById('inventory-modal').style.display = 'flex';
    closeDrawer();
}

function filterInventoryTable(filterText) {
    const container = document.getElementById('inventory-table-container');
    if (!container) return;

    const filter = filterText.toLowerCase();

    const filteredItems = kasirItems.filter(item => {
        const matchesName = item.name.toLowerCase().includes(filter);
        const matchesCode = item.code.toLowerCase().includes(filter);
        const matchesBarcode = item.barcode && item.barcode.toLowerCase().includes(filter);

        let matchesUnitBarcode = false;
        if (item.unitConversions && Array.isArray(item.unitConversions)) {
            matchesUnitBarcode = item.unitConversions.some(conv =>
                conv.barcode && conv.barcode.toLowerCase().includes(filter)
            );
        }

        return matchesName || matchesCode || matchesBarcode || matchesUnitBarcode;
    });

    let tableHtml = '<table style="width:100%; border-collapse:collapse;">';
    tableHtml += '<thead><tr><th>Nama Item</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>';

    filteredItems.forEach(item => {
        tableHtml += `<tr>
            <td>${item.name}</td>
            <td>${item.stock !== undefined ? item.stock : 0}</td>
            <td>
                <button class="action-btn edit-btn" onclick="openStockOpnameForItem('${item.id}')">
                    ${icons.edit}
                </button>
            </td>
        </tr>`;
    });

    tableHtml += '</tbody></table>';
    container.innerHTML = tableHtml;
}

function openInventoryOpnameModal() {
    openInventoryStokModal();
    closeDrawer();
}

function openStockOpnameForItem(itemId) {
    const item = kasirItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('inventory-modal-title').innerHTML = `
        <svg class="icon icon-primary" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
        </svg> Stok Opname: ${item.name}`;
    
    const html = `
        <div style="padding:20px;">
            <label>Stok Saat Ini: ${item.stock}</label>
            <input type="number" id="opname-stock-value" class="form-input" value="${item.stock}" step="any" min="0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px; margin-top:20px;">
                <button class="form-button-secondary" onclick="openInventoryStokModal()">Batal</button>
                <button class="form-button-primary" onclick="updateStock('${item.id}')">Simpan</button>
            </div>
        </div>
    `;
    document.getElementById('inventory-modal-body').innerHTML = html;
}

async function updateStock(itemId) {
    const newStock = parseFloat(document.getElementById('opname-stock-value').value);
    if (isNaN(newStock) || newStock < 0) {
        showNotification('Stok harus angka positif', 'error');
        return;
    }
    try {
        showLoading();
        const item = kasirItems.find(i => i.id === itemId);
        if (item) {
            item.stock = newStock;
            item.updatedAt = new Date().toISOString();
            await firebasePut(collections.KASIR_ITEMS, item);
            await loadKasirItems();
            showNotification('Stok diperbarui', 'success');
            openInventoryStokModal();
        }
    } catch (error) {
        showNotification('Gagal update stok: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function openInventoryLaporanModal() {
    document.getElementById('inventory-modal-title').innerHTML = `
        <svg class="icon icon-primary" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg> Laporan Stok`;
    
    let html = '<div style="max-height:400px; overflow-y:auto;">';
    html += '<table style="width:100%; border-collapse:collapse;">';
    html += '<thead><tr><th>Nama Item</th><th>Stok</th></tr></thead><tbody>';
    kasirItems.forEach(item => {
        html += `<tr><td>${item.name}</td><td>${item.stock !== undefined ? item.stock : 0}</td></tr>`;
    });
    html += '</tbody></table></div>';
    html += '<div style="margin-top:20px;"><button class="form-button-secondary" onclick="closeInventoryModal()">Tutup</button></div>';
    
    document.getElementById('inventory-modal-body').innerHTML = html;
    document.getElementById('inventory-modal').style.display = 'flex';
    closeDrawer();
}

function closeInventoryModal() {
    document.getElementById('inventory-modal').style.display = 'none';
}

// ==================== FUNGSI TAMPILAN PRODUK ====================
function setProductViewMode(mode) {
    productViewMode = mode;
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    if (listBtn && gridBtn) {
        if (mode === 'list') {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
        } else {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
        }
    }
    renderProductList();
}

function renderProductList(itemsToRender = null) {
    const container = document.getElementById('product-container');
    if (!container) return;

    const items = itemsToRender || kasirItems;
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px;">Tidak ada produk</div>';
        return;
    }

    let html = '';
    if (productViewMode === 'list') {
        html = '<div class="product-list">';
        items.forEach(item => {
            let step = item.isWeighable ? '0.01' : '1';
            let min = '0.01';
            html += `
                <div class="product-list-item" onclick="addToCartFromProductWithQty('${item.id}', this)">
                    <div class="name"><strong>${item.name}</strong></div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 4px 0;">
                        <span class="price" style="font-size: 0.9rem;">${formatRupiah(item.hargaJual)}</span>
                        <div class="qty-control">
                            <button class="qty-minus" onclick="event.stopPropagation(); adjustQty(this, -1, '${item.id}')">-</button>
                            <input type="number" class="qty-input" value="1" min="${min}" max="${item.stock}" step="${step}" data-id="${item.id}" onclick="event.stopPropagation();" onchange="event.stopPropagation();">
                            <button class="qty-plus" onclick="event.stopPropagation(); adjustQty(this, 1, '${item.id}')">+</button>
                        </div>
                    </div>
                    <div class="stock" style="font-size: 0.8rem; color: ${item.stock > 0 ? '#006B54' : '#ff6b6b'}">Stok: ${item.stock}</div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html = '<div class="product-grid">';
        items.forEach(item => {
            let step = item.isWeighable ? '0.01' : '1';
            let min = '0.01';
            html += `
                <div class="product-card" onclick="addToCartFromProductWithQty('${item.id}', this)">
                    <div class="product-image">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" fill="none"/>
                            <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor"/>
                            <line x1="7" y1="15" x2="12" y2="15" stroke="currentColor"/>
                        </svg>
                    </div>
                    <div class="name"><strong>${item.name}</strong></div>
                    <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                        <span class="price">${formatRupiah(item.hargaJual)}</span>
                        <span class="stock" style="color: ${item.stock > 0 ? '#006B54' : '#ff6b6b'}">Stok: ${item.stock}</span>
                    </div>
                    <div class="qty-control" style="display: flex; justify-content: center; gap: 5px; margin-top: 5px;">
                        <button class="qty-minus" onclick="event.stopPropagation(); adjustQty(this, -1, '${item.id}')">-</button>
                        <input type="number" class="qty-input" value="1" min="${min}" max="${item.stock}" step="${step}" data-id="${item.id}" style="width: 50px; text-align: center;" onclick="event.stopPropagation();" onchange="event.stopPropagation();">
                        <button class="qty-plus" onclick="event.stopPropagation(); adjustQty(this, 1, '${item.id}')">+</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    container.innerHTML = html;
}

function filterProductList(keyword) {
    keyword = keyword.toLowerCase().trim();
    if (!keyword) {
        currentFilteredItems = [...kasirItems];
    } else {
        currentFilteredItems = kasirItems.filter(item => {
            const matchItem = 
                (item.name && item.name.toLowerCase().includes(keyword)) ||
                (item.code && item.code.toLowerCase().includes(keyword)) ||
                (item.barcode && item.barcode.toLowerCase().includes(keyword));
            if (matchItem) return true;

            if (item.unitConversions && Array.isArray(item.unitConversions)) {
                return item.unitConversions.some(conv => 
                    conv.barcode && conv.barcode.toLowerCase().includes(keyword)
                );
            }
            return false;
        });
    }
    renderProductList(currentFilteredItems);
}

function adjustQty(btn, delta, itemId) {
    const container = btn.closest('.product-list-item, .product-card');
    const input = container.querySelector('.qty-input');
    if (input) {
        const item = kasirItems.find(i => i.id === itemId);
        let step = 1;
        if (item && item.isWeighable) step = 0.01;
        let newVal = parseFloat(input.value) + (delta * step);
        let min = parseFloat(input.min) || 0.01;
        let max = parseFloat(input.max);
        if (newVal < min) newVal = min;
        if (newVal > max) newVal = max;
        if (item && item.isWeighable) {
            newVal = Math.round(newVal * 100) / 100;
        } else {
            newVal = Math.round(newVal);
        }
        input.value = newVal;
    }
}

function addToCartFromProductWithQty(itemId, element) {
    const input = element.querySelector('.qty-input');
    let qty = 1;
    if (input) {
        qty = parseFloat(input.value);
        if (isNaN(qty) || qty <= 0) qty = 0.01;
    }
    const item = kasirItems.find(i => i.id === itemId);
    if (item) {
        addToCart(item, qty, null, 0);
    }
}

// ==================== FUNGSI PENDING TRANSACTIONS (DENGAN KODE PENDING) ====================
function openPendingTransactionsModal() {
    const container = document.getElementById('pending-transactions-list');
    container.innerHTML = '';
    if (pendingTransactions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Tidak ada transaksi pending.</div>';
    } else {
        pendingTransactions.forEach((trans, index) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <div style="flex:1;">
                    <strong>${trans.pendingCode || 'Transaksi ' + trans.id}</strong><br>
                    <span style="font-size:0.8rem;">
                        Tanggal: ${new Date(trans.createdAt).toLocaleString()}<br>
                        Total: ${formatRupiah(trans.total)}<br>
                        Customer: ${trans.customerName || '-'}
                    </span>
                </div>
                <div>
                    <button class="action-btn edit-btn" onclick="loadPendingTransaction('${trans.id}')">Muat</button>
                    <button class="action-btn delete-btn" onclick="deletePendingTransactionPrompt('${trans.id}')">Hapus</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    document.getElementById('pending-transactions-modal').style.display = 'flex';
}

function closePendingTransactionsModal() {
    document.getElementById('pending-transactions-modal').style.display = 'none';
}

async function deletePendingTransactionPrompt(id) {
    if (confirm('Hapus transaksi pending ini?')) {
        await deletePendingTransaction(id);
        openPendingTransactionsModal();
    }
}

function loadPendingTransaction(id) {
    const trans = pendingTransactions.find(t => t.id === id);
    if (trans) {
        const newCart = [];
        trans.cart.forEach(c => {
            const item = kasirItems.find(i => i.id === c.itemId);
            if (item) {
                newCart.push({
                    item: item,
                    qty: c.qty,
                    unitConversion: c.unitConversion,
                    weightGram: c.weightGram,
                    pricePerUnit: c.pricePerUnit,
                    subtotal: c.subtotal
                });
            } else {
                showNotification(`Item dengan ID ${c.itemId} tidak ditemukan, dilewati.`, 'warning');
            }
        });
        cart = newCart;
        if (trans.customerId) {
            const cust = customers.find(c => c.id === trans.customerId);
            if (cust) selectedCustomer = cust;
            else selectedCustomer = null;
        } else {
            selectedCustomer = null;
        }
        const badge = document.getElementById('customer-badge');
        if (selectedCustomer) {
            badge.textContent = selectedCustomer.name.charAt(0).toUpperCase();
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
        renderCartPage();
        updatePiutangButtonCart();
        saveCartToLocalStorage();
        showNotification('Transaksi pending dimuat', 'success');
        closePendingTransactionsModal();
        if (document.getElementById('transaksi-page').style.display !== 'block') {
            openTransaksiPage();
        }
    }
}

function saveDraftTransaction() {
    if (cart.length === 0) {
        showNotification('Keranjang kosong, tidak ada yang disimpan', 'warning');
        return;
    }
    document.getElementById('pending-code-input').value = '';
    document.getElementById('pending-code-modal').style.display = 'flex';
}

function closePendingCodeModal() {
    document.getElementById('pending-code-modal').style.display = 'none';
}

async function confirmSaveDraft() {
    const pendingCode = document.getElementById('pending-code-input').value.trim();
    closePendingCodeModal();

    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);
    const transactionData = {
        pendingCode: pendingCode || `Pending ${new Date().toLocaleString()}`,
        cart: cart.map(c => ({
            itemId: c.item.id,
            itemName: c.item.name,
            qty: c.qty,
            unitConversion: c.unitConversion ? { ...c.unitConversion } : null,
            weightGram: c.weightGram,
            pricePerUnit: c.pricePerUnit,
            subtotal: c.subtotal
        })),
        customerId: selectedCustomer ? selectedCustomer.id : null,
        customerName: selectedCustomer ? selectedCustomer.name : null,
        total: total,
        createdAt: new Date().toISOString()
    };
    try {
        showLoading();
        await savePendingTransaction(transactionData);
        showNotification('Transaksi disimpan sebagai draft', 'success');
    } catch (error) {
        showNotification('Gagal menyimpan draft: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ==================== FUNGSI LAPORAN PENJUALAN ====================
function openLaporanPage() {
    window.open('laporan.html', '_blank');
}

// ==================== FUNGSI PEMBELIAN (MENU BARU) ====================
function openPembelianPage() {
    window.open('pembelian.html', '_blank');
}

// ==================== FUNGSI GENERATE NOMOR TRANSAKSI ====================
async function generateTransactionNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    let lastCounter = 0;
    try {
        const doc = await firestore.collection(collections.SETTINGS).doc('lastTransactionNumber').get();
        if (doc.exists) {
            const data = doc.data();
            if (data.date === dateStr) {
                lastCounter = data.counter;
            } else {
                lastCounter = 0;
            }
        }
    } catch (error) {
        console.warn('Gagal membaca counter transaksi:', error);
    }

    const newCounter = lastCounter + 1;
    const transactionNumber = `INV-${dateStr}-${String(newCounter).padStart(5, '0')}`;

    try {
        await firestore.collection(collections.SETTINGS).doc('lastTransactionNumber').set({
            date: dateStr,
            counter: newCounter
        });
    } catch (error) {
        console.error('Gagal menyimpan counter transaksi:', error);
    }

    return transactionNumber;
}

// ==================== INISIALISASI ====================
async function initApp() {
    try {
        console.log('Starting app initialization...');
        showLoading();
        hideError();
        await loadBarcodeConfig();
        await loadReceiptConfig();
        await loadKasirCategories();
        await loadKasirItems();
        currentFilteredItems = [...kasirItems];
        await loadKasirSatuan();
        await loadCustomers();
        await loadSuppliers();
        await loadPendingTransactions();
        await loadCartFromLocalStorage();
        await autoReconnectPrinter();

        // Cek status unlock dari localStorage
        if (!checkUnlockedStatus()) {
            showLoginScreen();
        } else {
            document.getElementById('login-overlay').style.display = 'none';
        }

        console.log('App initialized successfully');
        showNotification('Aplikasi siap.', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        let errorMessage = 'Gagal memuat aplikasi: ' + error.message;
        showError(errorMessage);
    } finally { hideLoading(); }
}

async function retryAppLoad() { await initApp(); }

document.addEventListener('DOMContentLoaded', async () => { console.log('DOM fully loaded, initializing app...'); await initApp(); });

window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        if (event.target.id === 'kasir-category-modal') closeKasirCategoryModal();
        else if (event.target.id === 'kasir-item-modal') closeKasirItemModal();
        else if (event.target.id === 'list-kasir-category-modal') closeListKasirCategoryModal();
        else if (event.target.id === 'list-kasir-item-modal') closeListKasirItemModal();
        else if (event.target.id === 'list-satuan-modal') closeListSatuanModal();
        else if (event.target.id === 'satuan-modal') closeSatuanModal();
        else if (event.target.id === 'settings-modal') closeSettingsModal();
        else if (event.target.id === 'inventory-modal') closeInventoryModal();
        else if (event.target.id === 'customer-modal') closeCustomerModal();
        else if (event.target.id === 'list-customer-modal') closeListCustomerModal();
        else if (event.target.id === 'supplier-modal') closeSupplierModal();
        else if (event.target.id === 'list-supplier-modal') closeListSupplierModal();
        else if (event.target.id === 'select-customer-modal') closeSelectCustomerModal();
        else if (event.target.id === 'pending-transactions-modal') closePendingTransactionsModal();
        else if (event.target.id === 'confirm-piutang-modal') closeConfirmPiutangModal();
        else if (event.target.id === 'pending-code-modal') closePendingCodeModal();
    }
};

document.addEventListener('visibilitychange', () => { if (!document.hidden) { console.log('Page became visible, refreshing data...'); refreshData(); } });

async function refreshData() {
    try {
        showLoading();
        await loadKasirCategories();
        await loadKasirItems();
        await loadKasirSatuan();
        await loadCustomers();
        await loadSuppliers();
        await loadPendingTransactions();
        console.log('Data refreshed successfully');
    } catch (error) { console.error('Error refreshing data:', error); } finally { hideLoading(); }
}

// ==================== INCLUDE MASTER-DATA.JS FUNCTIONS ====================
// master-data.js
// Fungsi-fungsi master data yang menggunakan Firestore

// ==================== FUNGSI MODAL KATEGORI ====================
function openTambahKategoriKasirModal(editId = null) {
    const modal = document.getElementById('kasir-category-modal');
    const input = document.getElementById('kasir-category-name');
    const title = document.getElementById('kasir-category-title');
    if (editId) {
        const cat = kasirCategories.find(c => c.id === editId);
        if (cat) {
            input.value = cat.name;
            editingKasirCategoryId = editId;
            title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Kategori Kasir`;
        }
    } else {
        input.value = '';
        editingKasirCategoryId = null;
        title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Tambah Kategori Kasir`;
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeKasirCategoryModal() {
    document.getElementById('kasir-category-modal').style.display = 'none';
    editingKasirCategoryId = null;
}

async function saveKasirCategory() {
    const nameInput = document.getElementById('kasir-category-name');
    const name = nameInput.value.trim();
    if (!name) { showNotification('Nama kategori harus diisi!', 'error'); return; }
    try {
        showLoading();
        const now = new Date().toISOString();
        if (editingKasirCategoryId) {
            const cat = kasirCategories.find(c => c.id === editingKasirCategoryId);
            if (cat) {
                const duplicate = kasirCategories.find(c => c.id !== editingKasirCategoryId && c.name.toLowerCase() === name.toLowerCase());
                if (duplicate) { showNotification(`Kategori "${name}" sudah ada!`, 'error'); return; }
                cat.name = name;
                cat.updatedAt = now;
                await firebasePut(collections.KASIR_CATEGORIES, cat);
            }
        } else {
            const duplicate = kasirCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (duplicate) { showNotification(`Kategori "${name}" sudah ada!`, 'error'); return; }
            const newCat = { name: name, createdAt: now, updatedAt: now };
            const id = await firebaseAdd(collections.KASIR_CATEGORIES, newCat);
            newCat.id = id;
            kasirCategories.push(newCat);
        }
        await loadKasirCategories();
        showNotification('Kategori kasir berhasil disimpan!', 'success');
        closeKasirCategoryModal();
    } catch (error) { console.error('Error saving kasir category:', error); showNotification('Gagal menyimpan: ' + error.message, 'error'); } finally { hideLoading(); }
}

async function deleteKasirCategory(categoryId) {
    if (!confirm('Hapus kategori ini? Semua item dengan kategori ini akan kehilangan kategori.')) return;
    try {
        showLoading();
        const itemsToUpdate = kasirItems.filter(i => i.categoryId === categoryId);
        for (let item of itemsToUpdate) {
            item.categoryId = null;
            await firebasePut(collections.KASIR_ITEMS, item);
        }
        await firebaseDelete(collections.KASIR_CATEGORIES, categoryId);
        await loadKasirCategories();
        await loadKasirItems();
        showNotification('Kategori dihapus', 'success');
        closeListKasirCategoryModal();
        openDaftarKategoriKasirModal();
    } catch (error) { console.error('Error deleting kasir category:', error); showNotification('Gagal hapus: ' + error.message, 'error'); } finally { hideLoading(); }
}

function openDaftarKategoriKasirModal() {
    const modal = document.getElementById('list-kasir-category-modal');
    const container = document.getElementById('kasir-category-list-container');
    container.innerHTML = '';
    if (kasirCategories.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Belum ada kategori.</div>';
    } else {
        kasirCategories.forEach(cat => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <span>${cat.name}</span>
                <div class="three-dots-menu">
                    <button class="three-dots-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="three-dots-dropdown">
                        <div class="dropdown-item edit" onclick="openTambahKategoriKasirModal('${cat.id}'); event.stopPropagation();">${icons.edit} Edit</div>
                        <div class="dropdown-item delete" onclick="deleteKasirCategory('${cat.id}'); event.stopPropagation();">${icons.delete} Hapus</div>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeListKasirCategoryModal() { document.getElementById('list-kasir-category-modal').style.display = 'none'; }

// ==================== FUNGSI LEVEL HARGA ====================
function addLevelRow(qty = '', price = '', levelNumber = null) {
    const container = document.getElementById('level-harga-container');
    const div = document.createElement('div');
    div.className = 'level-harga-item';
    const number = levelNumber || (container.children.length + 1);
    div.innerHTML = `
        <span class="level-number">Level ${number}</span>
        <input type="number" class="form-input level-qty" placeholder="" value="${qty}" min="0" step="any">
        <input type="number" class="form-input level-price" placeholder="" value="${price}" min="0" step="0.01">
        <button type="button" class="level-harga-remove" onclick="hapusLevelHarga(this)">×</button>
    `;
    container.appendChild(div);
}

function hapusLevelHarga(btn) {
    if (document.querySelectorAll('.level-harga-item').length <= 1) {
        showNotification('Minimal harus ada 1 level harga', 'error');
        return;
    }
    btn.closest('.level-harga-item').remove();
    renumberLevels();
}

function renumberLevels() {
    const items = document.querySelectorAll('.level-harga-item');
    items.forEach((item, index) => {
        const span = item.querySelector('.level-number');
        span.textContent = `Level ${index + 1}`;
    });
}

function validateLevels() {
    const items = document.querySelectorAll('.level-harga-item');
    const errorDiv = document.getElementById('level-error');
    if (!errorDiv) return true;

    let errors = [];
    let levels = [];

    items.forEach((item, idx) => {
        const qtyInput = item.querySelector('.level-qty');
        const priceInput = item.querySelector('.level-price');
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);

        if (isNaN(qty) || qty < 0) {
            errors.push(`Level ${idx+1}: Qty harus angka positif`);
        }
        if (isNaN(price) || price < 0) {
            errors.push(`Level ${idx+1}: Harga harus ≥ 0`);
        }

        levels.push({ qty, price, idx });
    });

    const qtyValues = levels.map(l => l.qty);
    const duplicateQty = qtyValues.filter((q, i) => qtyValues.indexOf(q) !== i);
    if (duplicateQty.length > 0) {
        errors.push('Qty antar level tidak boleh sama');
    }

    let sorted = true;
    for (let i = 0; i < levels.length - 1; i++) {
        if (levels[i].qty > levels[i+1].qty) {
            sorted = false;
            break;
        }
    }
    if (!sorted) {
        errors.push('Qty harus berurutan naik (ascending)');
    }

    if (errors.length > 0) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = errors.join('<br>');
        return false;
    } else {
        errorDiv.style.display = 'none';
        return true;
    }
}

function getPriceLevelsFromDOM() {
    const items = document.querySelectorAll('.level-harga-item');
    const priceLevels = [];
    items.forEach((item, index) => {
        const qty = parseFloat(item.querySelector('.level-qty').value) || 0;
        const price = parseFloat(item.querySelector('.level-price').value) || 0;
        priceLevels.push({
            level: index + 1,
            minQty: qty,
            price: price
        });
    });
    return priceLevels;
}

// ==================== FUNGSI MODAL ITEM ====================
function openTambahItemKasirModal(editId = null) {
    const modal = document.getElementById('kasir-item-modal');
    const title = document.getElementById('kasir-item-title');
    const nameInput = document.getElementById('kasir-item-name');
    const codeInput = document.getElementById('kasir-item-code');
    const barcodeInput = document.getElementById('kasir-item-barcode');
    const catSelect = document.getElementById('kasir-item-category');
    const hargaDasarInput = document.getElementById('kasir-item-harga-dasar');
    const hargaJualInput = document.getElementById('kasir-item-harga-jual');
    const beratInput = document.getElementById('kasir-item-berat');
    const satuanSelect = document.getElementById('kasir-item-satuan');
    const diskonInput = document.getElementById('kasir-item-diskon');
    const stockInput = document.getElementById('kasir-item-stock');
    const weighableCheck = document.getElementById('kasir-item-weighable');
    const levelContainer = document.getElementById('level-harga-container');
    const errorDiv = document.getElementById('level-error');
    
    catSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kasirCategories.forEach(cat => { catSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`; });
    
    const satuanOptions = kasirSatuan.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    satuanSelect.innerHTML = '<option value="">-- Pilih Satuan --</option>' + satuanOptions;
    
    nameInput.value = '';
    codeInput.value = '';
    barcodeInput.value = '';
    catSelect.value = '';
    hargaDasarInput.value = '';
    hargaJualInput.value = '';
    beratInput.value = '';
    satuanSelect.value = '';
    diskonInput.value = '';
    stockInput.value = '0';
    weighableCheck.checked = false;
    
    levelContainer.innerHTML = '';
    if (editId) {
        const item = kasirItems.find(i => i.id === editId);
        if (item) {
            nameInput.value = item.name;
            codeInput.value = item.code;
            barcodeInput.value = item.barcode || item.code;
            catSelect.value = item.categoryId || '';
            hargaDasarInput.value = item.hargaDasar || '';
            hargaJualInput.value = item.hargaJual || '';
            beratInput.value = item.berat || '';
            satuanSelect.value = item.satuanId || '';
            diskonInput.value = item.diskon || '';
            stockInput.value = item.stock || 0;
            weighableCheck.checked = item.isWeighable || false;
            
            if (item.priceLevels && item.priceLevels.length > 0) {
                item.priceLevels.forEach(l => {
                    addLevelRow(l.minQty, l.price, l.level);
                });
            } else {
                addLevelRow('', '', 1);
                addLevelRow('', '', 2);
                addLevelRow('', '', 3);
            }
            
            tempUnitConversions = item.unitConversions ? JSON.parse(JSON.stringify(item.unitConversions)) : [];
            editingKasirItemId = editId;
            title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Item Kasir`;
        }
    } else {
        editingKasirItemId = null;
        title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Tambah Item Kasir`;
        addLevelRow('', '', 1);
        addLevelRow('', '', 2);
        addLevelRow('', '', 3);
    }

    if (errorDiv) errorDiv.style.display = 'none';
    
    const convUnitSelect = document.getElementById('conv-unit');
    if (convUnitSelect) {
        convUnitSelect.innerHTML = '<option value="">-- Pilih Satuan --</option>';
        kasirSatuan.forEach(sat => {
            convUnitSelect.innerHTML += `<option value="${sat.id}">${sat.name}</option>`;
        });
    }
    
    renderConversionsList();
    hideConversionForm();
    modal.style.display = 'flex';
    closeDrawer();
}

function closeKasirItemModal() {
    document.getElementById('kasir-item-modal').style.display = 'none';
    editingKasirItemId = null;
    tempUnitConversions = [];
    hideConversionForm();
}

async function saveKasirItem() {
    const name = document.getElementById('kasir-item-name').value.trim();
    const code = document.getElementById('kasir-item-code').value.trim();
    const barcode = document.getElementById('kasir-item-barcode').value.trim() || code;
    const categoryId = document.getElementById('kasir-item-category').value || null;
    const hargaDasar = parseFloat(document.getElementById('kasir-item-harga-dasar').value) || '';
    const hargaJual = parseFloat(document.getElementById('kasir-item-harga-jual').value) || '';
    const berat = parseFloat(document.getElementById('kasir-item-berat').value) || '';
    const satuanId = document.getElementById('kasir-item-satuan').value || null;
    const diskon = parseFloat(document.getElementById('kasir-item-diskon').value) || '';
    const stock = parseFloat(document.getElementById('kasir-item-stock').value) || 0;
    const isWeighable = document.getElementById('kasir-item-weighable').checked;
    
    const priceLevels = getPriceLevelsFromDOM();
    if (!validateLevels()) {
        showNotification('Level harga tidak valid, periksa kembali', 'error');
        return;
    }
    
    if (!name || !code) { showNotification('Nama dan kode harus diisi!', 'error'); return; }
    
    try {
        showLoading();
        const now = new Date().toISOString();
        const duplicate = kasirItems.find(i => {
            if (editingKasirItemId && i.id === editingKasirItemId) return false;
            return i.code === code;
        });
        if (duplicate) { showNotification(`Kode "${code}" sudah digunakan!`, 'error'); return; }
        
        const unitConversions = [...tempUnitConversions];
        
        if (editingKasirItemId) {
            const item = kasirItems.find(i => i.id === editingKasirItemId);
            if (item) {
                item.name = name;
                item.code = code;
                item.barcode = barcode;
                item.categoryId = categoryId;
                item.hargaDasar = hargaDasar;
                item.hargaJual = hargaJual;
                item.berat = berat;
                item.satuanId = satuanId;
                item.diskon = diskon;
                item.stock = stock;
                item.isWeighable = isWeighable;
                item.priceLevels = priceLevels;
                item.unitConversions = unitConversions;
                item.updatedAt = now;
                await firebasePut(collections.KASIR_ITEMS, item);
            }
        } else {
            const newItem = {
                name, code, barcode, categoryId, hargaDasar, hargaJual, berat, satuanId,
                diskon, stock, isWeighable, priceLevels, unitConversions,
                createdAt: now, updatedAt: now
            };
            const id = await firebaseAdd(collections.KASIR_ITEMS, newItem);
            newItem.id = id;
            kasirItems.push(newItem);
        }
        await loadKasirItems();
        showNotification('Item kasir berhasil disimpan!', 'success');
        closeKasirItemModal();
    } catch (error) {
        console.error('Error saving kasir item:', error);
        showNotification('Gagal menyimpan: ' + error.message, 'error');
    } finally { hideLoading(); }
}

async function deleteKasirItem(itemId) {
    if (!confirm('Hapus item ini?')) return;
    try {
        showLoading();
        await firebaseDelete(collections.KASIR_ITEMS, itemId);
        await loadKasirItems();
        showNotification('Item dihapus', 'success');
        closeListKasirItemModal();
        openDaftarItemKasirModal();
    } catch (error) { console.error('Error deleting kasir item:', error); showNotification('Gagal hapus: ' + error.message, 'error'); } finally { hideLoading(); }
}

function openDaftarItemKasirModal() {
    const modal = document.getElementById('list-kasir-item-modal');
    const container = document.getElementById('kasir-item-list-container');
    const catMap = {}; kasirCategories.forEach(c => catMap[c.id] = c.name);
    const satuanMap = {}; kasirSatuan.forEach(s => satuanMap[s.id] = s.name);
    container.innerHTML = '';
    if (kasirItems.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Belum ada item.</div>';
    } else {
        kasirItems.forEach(item => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <div style="flex:1;">
                    <strong>${item.name}</strong><br>
                    <span style="font-size:0.8rem;">
                        Kode: ${item.code} | Barcode: ${item.barcode || item.code}<br>
                        Harga Jual: Rp ${item.hargaJual.toLocaleString()} | Kategori: ${item.categoryId ? catMap[item.categoryId] || '-' : '-'}<br>
                        Berat: ${item.berat} ${item.satuanId ? satuanMap[item.satuanId] : ''}
                        ${item.diskon ? ' | Diskon: '+item.diskon+'%' : ''}
                        ${item.isWeighable ? ' | Timbangan' : ''}
                        | Stok: ${item.stock !== undefined ? item.stock : 0}
                    </span>
                </div>
                <div>
                    <button class="action-btn edit-btn" onclick="openTambahItemKasirModal('${item.id}')">${icons.edit}</button>
                    <button class="action-btn delete-btn" onclick="deleteKasirItem('${item.id}')">${icons.delete}</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeListKasirItemModal() { document.getElementById('list-kasir-item-modal').style.display = 'none'; }

// ==================== FUNGSI SATUAN ====================
function openTambahSatuanModal(editId = null) {
    const modal = document.getElementById('satuan-modal');
    const title = document.getElementById('satuan-modal-title');
    const input = document.getElementById('satuan-name');
    if (editId) {
        const sat = kasirSatuan.find(s => s.id === editId);
        if (sat) {
            input.value = sat.name;
            editingSatuanId = editId;
            title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Satuan`;
        }
    } else {
        input.value = '';
        editingSatuanId = null;
        title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Tambah Satuan`;
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeSatuanModal() { document.getElementById('satuan-modal').style.display = 'none'; editingSatuanId = null; }

async function saveSatuan() {
    const name = document.getElementById('satuan-name').value.trim();
    if (!name) { showNotification('Nama satuan harus diisi!', 'error'); return; }
    try {
        showLoading();
        const now = new Date().toISOString();
        if (editingSatuanId) {
            const sat = kasirSatuan.find(s => s.id === editingSatuanId);
            if (sat) {
                const duplicate = kasirSatuan.find(s => s.id !== editingSatuanId && s.name.toLowerCase() === name.toLowerCase());
                if (duplicate) { showNotification(`Satuan "${name}" sudah ada!`, 'error'); return; }
                sat.name = name;
                sat.updatedAt = now;
                await firebasePut(collections.KASIR_SATUAN, sat);
            }
        } else {
            const duplicate = kasirSatuan.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (duplicate) { showNotification(`Satuan "${name}" sudah ada!`, 'error'); return; }
            const newSat = { name: name, createdAt: now, updatedAt: now };
            const id = await firebaseAdd(collections.KASIR_SATUAN, newSat);
            newSat.id = id;
            kasirSatuan.push(newSat);
        }
        await loadKasirSatuan();
        showNotification('Satuan berhasil disimpan!', 'success');
        closeSatuanModal();
    } catch (error) { console.error('Error saving satuan:', error); showNotification('Gagal menyimpan: ' + error.message, 'error'); } finally { hideLoading(); }
}

async function deleteSatuan(satuanId) {
    if (!confirm('Hapus satuan ini? Item yang menggunakan satuan ini akan kehilangan satuan.')) return;
    try {
        showLoading();
        const itemsToUpdate = kasirItems.filter(i => i.satuanId === satuanId);
        for (let item of itemsToUpdate) {
            item.satuanId = null;
            await firebasePut(collections.KASIR_ITEMS, item);
        }
        await firebaseDelete(collections.KASIR_SATUAN, satuanId);
        await loadKasirSatuan();
        await loadKasirItems();
        showNotification('Satuan dihapus', 'success');
        closeListSatuanModal();
        openDaftarSatuanModal();
    } catch (error) { console.error('Error deleting satuan:', error); showNotification('Gagal hapus: ' + error.message, 'error'); } finally { hideLoading(); }
}

function openDaftarSatuanModal() {
    const modal = document.getElementById('list-satuan-modal');
    const container = document.getElementById('satuan-list-container');
    container.innerHTML = '';
    if (kasirSatuan.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Belum ada satuan.</div>';
    } else {
        kasirSatuan.forEach(sat => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <span>${sat.name}</span>
                <div>
                    <button class="action-btn edit-btn" onclick="openTambahSatuanModal('${sat.id}')">${icons.edit}</button>
                    <button class="action-btn delete-btn" onclick="deleteSatuan('${sat.id}')">${icons.delete}</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeListSatuanModal() { document.getElementById('list-satuan-modal').style.display = 'none'; }

// ==================== FUNGSI KONVERSI SATUAN ====================
function showConversionForm(index = -1) {
    const formContainer = document.getElementById('conversion-form-container');
    const selectUnit = document.getElementById('conv-unit');
    const valueInput = document.getElementById('conv-value');
    const barcodeInput = document.getElementById('conv-barcode');
    const skuInput = document.getElementById('conv-sku');
    const basePriceInput = document.getElementById('conv-base-price');
    const sellPriceInput = document.getElementById('conv-sell-price');
    const pointsInput = document.getElementById('conv-points');
    const commissionInput = document.getElementById('conv-commission');

    selectUnit.innerHTML = '<option value="">-- Pilih Satuan --</option>';
    kasirSatuan.forEach(sat => {
        selectUnit.innerHTML += `<option value="${sat.id}">${sat.name}</option>`;
    });

    if (index >= 0) {
        editingConversionIndex = index;
        const conv = tempUnitConversions[index];
        selectUnit.value = conv.unit;
        valueInput.value = conv.value;
        barcodeInput.value = conv.barcode;
        skuInput.value = conv.sku || '';
        basePriceInput.value = conv.basePrice;
        sellPriceInput.value = conv.sellPrice;
        pointsInput.value = conv.customerPoint || '';
        commissionInput.value = conv.salesCommission || '';
    } else {
        editingConversionIndex = -1;
        selectUnit.value = '';
        valueInput.value = '';
        barcodeInput.value = '';
        skuInput.value = '';
        basePriceInput.value = '';
        sellPriceInput.value = '';
        pointsInput.value = '';
        commissionInput.value = '';
    }

    document.querySelectorAll('.conversion-edit-btn').forEach(btn => {
        btn.disabled = true;
    });

    formContainer.style.display = 'block';
}

function hideConversionForm() {
    document.querySelectorAll('.conversion-edit-btn').forEach(btn => {
        btn.disabled = false;
    });
    document.getElementById('conversion-form-container').style.display = 'none';
    editingConversionIndex = -1;
}

function saveConversion() {
    const unit = document.getElementById('conv-unit').value;
    const value = parseFloat(document.getElementById('conv-value').value);
    const barcode = document.getElementById('conv-barcode').value.trim();
    const sku = document.getElementById('conv-sku').value.trim();
    const basePrice = parseFloat(document.getElementById('conv-base-price').value) || '';
    const sellPrice = parseFloat(document.getElementById('conv-sell-price').value) || '';
    const customerPoint = parseFloat(document.getElementById('conv-points').value) || '';
    const salesCommission = parseFloat(document.getElementById('conv-commission').value) || '';

    if (!unit) { showNotification('Satuan harus dipilih!', 'error'); return; }
    if (!value || value <= 0) { showNotification('Nilai satuan harus lebih dari 0!', 'error'); return; }
    if (!barcode) { showNotification('Barcode satuan harus diisi!', 'error'); return; }

    const isDuplicateValue = tempUnitConversions.some((conv, idx) => 
        idx !== editingConversionIndex && conv.value === value
    );
    const isDuplicateBarcode = tempUnitConversions.some((conv, idx) => 
        idx !== editingConversionIndex && conv.barcode === barcode
    );

    if (isDuplicateValue) { showNotification('Nilai satuan harus unik!', 'error'); return; }
    if (isDuplicateBarcode) { showNotification('Barcode satuan harus unik!', 'error'); return; }

    const conversionData = { unit, value, barcode, sku, basePrice, sellPrice, customerPoint, salesCommission };

    if (editingConversionIndex >= 0) {
        tempUnitConversions[editingConversionIndex] = conversionData;
    } else {
        tempUnitConversions.push(conversionData);
    }

    renderConversionsList();
    hideConversionForm();
}

function renderConversionsList() {
    const container = document.getElementById('conversions-list');
    container.innerHTML = '';

    if (tempUnitConversions.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:10px; color:#666;">Belum ada konversi satuan. Klik tombol di atas untuk menambah.</div>';
        return;
    }

    tempUnitConversions.forEach((conv, index) => {
        const unitName = kasirSatuan.find(s => s.id == conv.unit)?.name || '?';
        const div = document.createElement('div');
        div.className = 'conversion-item';
        div.innerHTML = `
            <div class="conversion-item-header">
                <span>${unitName} — Nilai: ${conv.value}</span>
                <div class="conversion-actions">
                    <button class="conversion-edit-btn" onclick="editConversion(${index})">${icons.edit}</button>
                    <button class="conversion-delete-btn" onclick="deleteConversion(${index})">${icons.delete}</button>
                </div>
            </div>
            <div class="conversion-item-details">
                <div>Barcode: ${conv.barcode}</div>
                <div>SKU: ${conv.sku || '-'}</div>
                <div>Harga Dasar: Rp ${conv.basePrice.toLocaleString()}</div>
                <div>Harga Jual: Rp ${conv.sellPrice.toLocaleString()}</div>
                ${conv.customerPoint ? `<div>Poin: ${conv.customerPoint}</div>` : ''}
                ${conv.salesCommission ? `<div>Komisi: ${conv.salesCommission}</div>` : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function editConversion(index) { showConversionForm(index); }

function deleteConversion(index) {
    if (confirm('Hapus konversi ini?')) {
        tempUnitConversions.splice(index, 1);
        renderConversionsList();
    }
}

// ==================== FUNGSI CUSTOMER ====================
function openTambahCustomerModal(editId = null) {
    const modal = document.getElementById('customer-modal');
    const title = document.getElementById('customer-modal-title');
    const nameInput = document.getElementById('customer-name');
    const codeInput = document.getElementById('customer-code');
    const tierSelect = document.getElementById('customer-tier');
    const accountInput = document.getElementById('customer-account');
    const bankInput = document.getElementById('customer-bank');
    const tokenInput = document.getElementById('customer-token');
    const emailInput = document.getElementById('customer-email');
    const phoneInput = document.getElementById('customer-phone');
    const addressInput = document.getElementById('customer-address');
    const outstandingInput = document.getElementById('customer-outstanding');

    if (editId) {
        const cust = customers.find(c => c.id === editId);
        if (cust) {
            nameInput.value = cust.name || '';
            codeInput.value = cust.code || '';
            tierSelect.value = cust.tier || 'Bronze';
            accountInput.value = cust.account || '';
            bankInput.value = cust.bank || '';
            tokenInput.value = cust.token || '';
            emailInput.value = cust.email || '';
            phoneInput.value = cust.phone || '';
            addressInput.value = cust.address || '';
            outstandingInput.value = cust.outstanding || 0;
            editingCustomerId = editId;
            title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Pelanggan`;
        }
    } else {
        nameInput.value = '';
        codeInput.value = '';
        tierSelect.value = 'Bronze';
        accountInput.value = '';
        bankInput.value = '';
        tokenInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';
        addressInput.value = '';
        outstandingInput.value = 0;
        editingCustomerId = null;
        title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/></svg> Tambah Pelanggan`;
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeCustomerModal() {
    document.getElementById('customer-modal').style.display = 'none';
    editingCustomerId = null;
}

async function saveCustomer() {
    const name = document.getElementById('customer-name').value.trim();
    const code = document.getElementById('customer-code').value.trim();
    const tier = document.getElementById('customer-tier').value;
    const account = document.getElementById('customer-account').value.trim();
    const bank = document.getElementById('customer-bank').value.trim();
    const token = document.getElementById('customer-token').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const outstanding = parseFloat(document.getElementById('customer-outstanding').value) || 0;

    if (!name) { showNotification('Nama pelanggan harus diisi!', 'error'); return; }

    try {
        showLoading();
        const now = new Date().toISOString();
        if (editingCustomerId) {
            const cust = customers.find(c => c.id === editingCustomerId);
            if (cust) {
                cust.name = name;
                cust.code = code;
                cust.tier = tier;
                cust.account = account;
                cust.bank = bank;
                cust.token = token;
                cust.email = email;
                cust.phone = phone;
                cust.address = address;
                cust.outstanding = outstanding;
                cust.updatedAt = now;
                await firebasePut(collections.CUSTOMERS, cust);
            }
        } else {
            const newCust = { 
                name, code, tier, account, bank, token, email, phone, address, outstanding,
                createdAt: now, updatedAt: now 
            };
            const id = await firebaseAdd(collections.CUSTOMERS, newCust);
            newCust.id = id;
            customers.push(newCust);
        }
        await loadCustomers();
        showNotification('Data pelanggan berhasil disimpan!', 'success');
        closeCustomerModal();
    } catch (error) {
        console.error('Error saving customer:', error);
        showNotification('Gagal menyimpan: ' + error.message, 'error');
    } finally { hideLoading(); }
}

async function deleteCustomer(customerId) {
    if (!confirm('Hapus pelanggan ini?')) return;
    try {
        showLoading();
        await firebaseDelete(collections.CUSTOMERS, customerId);
        await loadCustomers();
        showNotification('Pelanggan dihapus', 'success');
        closeListCustomerModal();
        openDaftarCustomerModal();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showNotification('Gagal hapus: ' + error.message, 'error');
    } finally { hideLoading(); }
}

function openDaftarCustomerModal() {
    const modal = document.getElementById('list-customer-modal');
    const container = document.getElementById('customer-list-container');
    container.innerHTML = '';
    if (customers.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Belum ada pelanggan.</div>';
    } else {
        customers.forEach(cust => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <div style="flex:1;">
                    <strong>${cust.name}</strong><br>
                    <span style="font-size:0.8rem;">
                        Kode: ${cust.code || '-'}<br>
                        Tier: ${cust.tier || '-'}<br>
                        Telepon: ${cust.phone || '-'}<br>
                        Email: ${cust.email || '-'}<br>
                        Rekening: ${cust.account || '-'}<br>
                        Bank: ${cust.bank || '-'}<br>
                        Token: ${cust.token || '-'}<br>
                        Alamat: ${cust.address || '-'}<br>
                        Piutang: ${formatRupiah(cust.outstanding || 0)}
                    </span>
                </div>
                <div>
                    <button class="action-btn edit-btn" onclick="openTambahCustomerModal('${cust.id}')">${icons.edit}</button>
                    <button class="action-btn delete-btn" onclick="deleteCustomer('${cust.id}')">${icons.delete}</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeListCustomerModal() {
    document.getElementById('list-customer-modal').style.display = 'none';
}

// ==================== FUNGSI SUPPLIER ====================
function openTambahSupplierModal(editId = null) {
    const modal = document.getElementById('supplier-modal');
    const title = document.getElementById('supplier-modal-title');
    const nameInput = document.getElementById('supplier-name');
    const codeInput = document.getElementById('supplier-code');
    const accountInput = document.getElementById('supplier-account');
    const emailInput = document.getElementById('supplier-email');
    const phoneInput = document.getElementById('supplier-phone');
    const addressInput = document.getElementById('supplier-address');

    if (editId) {
        const supp = suppliers.find(s => s.id === editId);
        if (supp) {
            nameInput.value = supp.name || '';
            codeInput.value = supp.code || '';
            accountInput.value = supp.account || '';
            emailInput.value = supp.email || '';
            phoneInput.value = supp.phone || '';
            addressInput.value = supp.address || '';
            editingSupplierId = editId;
            title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Supplier`;
        }
    } else {
        nameInput.value = '';
        codeInput.value = '';
        accountInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';
        addressInput.value = '';
        editingSupplierId = null;
        title.innerHTML = `<svg class="icon icon-primary" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="2"/></svg> Tambah Supplier`;
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeSupplierModal() {
    document.getElementById('supplier-modal').style.display = 'none';
    editingSupplierId = null;
}

async function saveSupplier() {
    const name = document.getElementById('supplier-name').value.trim();
    const code = document.getElementById('supplier-code').value.trim();
    const account = document.getElementById('supplier-account').value.trim();
    const email = document.getElementById('supplier-email').value.trim();
    const phone = document.getElementById('supplier-phone').value.trim();
    const address = document.getElementById('supplier-address').value.trim();

    if (!name) { showNotification('Nama supplier harus diisi!', 'error'); return; }

    try {
        showLoading();
        const now = new Date().toISOString();
        if (editingSupplierId) {
            const supp = suppliers.find(s => s.id === editingSupplierId);
            if (supp) {
                supp.name = name;
                supp.code = code;
                supp.account = account;
                supp.email = email;
                supp.phone = phone;
                supp.address = address;
                supp.updatedAt = now;
                await firebasePut(collections.SUPPLIERS, supp);
            }
        } else {
            const newSupp = { 
                name, code, account, email, phone, address,
                createdAt: now, updatedAt: now 
            };
            const id = await firebaseAdd(collections.SUPPLIERS, newSupp);
            newSupp.id = id;
            suppliers.push(newSupp);
        }
        await loadSuppliers();
        showNotification('Data supplier berhasil disimpan!', 'success');
        closeSupplierModal();
    } catch (error) {
        console.error('Error saving supplier:', error);
        showNotification('Gagal menyimpan: ' + error.message, 'error');
    } finally { hideLoading(); }
}

async function deleteSupplier(supplierId) {
    if (!confirm('Hapus supplier ini?')) return;
    try {
        showLoading();
        await firebaseDelete(collections.SUPPLIERS, supplierId);
        await loadSuppliers();
        showNotification('Supplier dihapus', 'success');
        closeListSupplierModal();
        openDaftarSupplierModal();
    } catch (error) {
        console.error('Error deleting supplier:', error);
        showNotification('Gagal hapus: ' + error.message, 'error');
    } finally { hideLoading(); }
}

function openDaftarSupplierModal() {
    const modal = document.getElementById('list-supplier-modal');
    const container = document.getElementById('supplier-list-container');
    container.innerHTML = '';
    if (suppliers.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Belum ada supplier.</div>';
    } else {
        suppliers.forEach(supp => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.innerHTML = `
                <div style="flex:1;">
                    <strong>${supp.name}</strong><br>
                    <span style="font-size:0.8rem;">
                        Kode: ${supp.code || '-'}<br>
                        Telepon: ${supp.phone || '-'}<br>
                        Email: ${supp.email || '-'}<br>
                        Rekening: ${supp.account || '-'}<br>
                        Alamat: ${supp.address || '-'}
                    </span>
                </div>
                <div>
                    <button class="action-btn edit-btn" onclick="openTambahSupplierModal('${supp.id}')">${icons.edit}</button>
                    <button class="action-btn delete-btn" onclick="deleteSupplier('${supp.id}')">${icons.delete}</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    modal.style.display = 'flex';
    closeDrawer();
}

function closeListSupplierModal() {
    document.getElementById('list-supplier-modal').style.display = 'none';
}

// ==================== FUNGSI DROPDOWN ====================
function toggleDropdown(btn) {
    const dropdown = btn.nextElementSibling;
    dropdown.classList.toggle('show');
    document.addEventListener('click', function close(e) {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', close);
        }
    });
}
