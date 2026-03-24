# XRP POS - React Native Application

Aplikasi Point of Sale (POS) modern berbasis **React Native** (Expo) untuk platform Ekserpi. Mendukung peran `Owner` dan `Cashier` dengan integrasi ke backend Go API.

## 🚀 Prasyarat
Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:
1. **Node.js** (versi 18.x atau lebih baru)
2. **Backend API Go** yang sudah berjalan di `localhost:4001` (atau sesuaikan IP server Anda di file `src/services/api.ts`).
3. **Expo Go** app di HP Anda (tersedia di Play Store/App Store) atau **Android Studio Emulator** di PC Anda.

## 🛠️ Cara Menjalankan untuk Pengembangan (Development)

1. **Buka terminal** di dalam folder `react_native`:
   ```bash
   cd react_native
   ```

2. **Jalankan Expo server**:
   ```bash
   npm start
   # atau
   npx expo start
   ```

3. **Cara Membuka Aplikasi**:
   - **Di HP Asli (Android/iOS):** Buka aplikasi **Expo Go**, lalu scan QR Code yang muncul di terminal. (Pastikan HP dan PC berada di jaringan WiFi yang sama). *Catatan: Jangan lupa ganti `BASE_URL` di `src/services/api.ts` dengan IP lokal laptop Anda (contoh: `192.168.1.10:4001`).*
   - **Di Emulator Android:** Tekan tombol `a` di terminal saat Expo server sedang berjalan. *Catatan: IP `10.0.2.2:4001` bawaan akan langsung bekerja untuk emulator Android.*
   - **Di Emulator iOS (Mac):** Tekan tombol `i` di terminal.

## 📦 Cara Mem-build APK Android (Production)

Proyek ini telah dikonfigurasi menggunakan **Expo Application Services (EAS)** untuk mempermudah proses build APK.

1. Install EAS CLI secara global (jika belum):
   ```bash
   npm install -g eas-cli
   ```

2. Login ke akun Expo Anda:
   ```bash
   eas login
   ```

3. Jalankan build untuk profil "preview" (menghasilkan format `.apk`):
   ```bash
   eas build -p android --profile preview
   ```

4. Tunggu hingga proses cloud build selesai. EAS akan memberikan **link download APK**. Download APK tersebut dan install di perangkat Android Anda.
 *(Anda juga bisa mengakses halaman dashboard Expo Anda untuk mendownloadnya).*

---
**Catatan Penting Konfigurasi:**
File environment dan IP koneksi backend berlokasi di `src/services/api.ts`. Ganti `BASE_URL` ke IP server production atau staging sebelum melakukan build APK.
