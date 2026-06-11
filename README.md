# 🚗 Güvenli Sürüş ve Davranış Analizi Sistemi

Güvenli Sürüş ve Davranış Analizi Sistemi, sürücülerin sürüş alışkanlıklarını analiz etmek, riskli davranışları tespit etmek ve sürüş güvenliğini artırmak amacıyla geliştirilmiş tam kapsamlı bir yazılım platformudur.

Sistem; mobil uygulama üzerinden toplanan sensör ve konum verilerini işleyerek sürüş performansını değerlendirir, elde edilen sonuçları web tabanlı yönetim paneli üzerinden görselleştirir ve raporlar.

---

## 🎯 Projenin Amacı

Trafik güvenliği günümüzde önemli sorunlardan biridir. Bu proje;

- Ani frenleme davranışlarını tespit etmek,
- Sert hızlanmaları belirlemek,
- Riskli sürüş alışkanlıklarını analiz etmek,
- Sürücü performansını değerlendirmek,
- Güvenli sürüş konusunda farkındalık oluşturmak

amacıyla geliştirilmiştir.

---

## 🏗️ Sistem Mimarisi

```text
┌──────────────────┐
│ Mobil Uygulama   │
│ Sensör Verileri  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend API      │
│ Veri İşleme      │
│ Analiz Motoru    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Veritabanı       │
│ Veri Saklama     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Web Paneli       │
│ İzleme & Rapor   │
└──────────────────┘
```

---

## ✨ Temel Özellikler

### 📱 Mobil Uygulama

- Sürüş oturumu başlatma ve sonlandırma
- GPS tabanlı konum takibi
- Sensör verilerinin toplanması
- Gerçek zamanlı sürüş kaydı
- Kullanıcı doğrulama işlemleri

### ⚙️ Backend Servisleri

- REST API mimarisi
- Sürücü davranış analizi
- Risk puanı hesaplama
- Olay tespit mekanizması
- Kullanıcı ve oturum yönetimi

### 🌐 Web Yönetim Paneli

- Gerçek zamanlı veri görüntüleme
- Sürüş geçmişi inceleme
- Performans raporları
- Risk analiz ekranları
- Yönetici paneli

### 🗄️ Veritabanı Katmanı

- Kullanıcı bilgileri
- Sürüş kayıtları
- Olay geçmişleri
- Analiz sonuçları

---

## 🔍 Analiz Edilen Sürüş Olayları

Sistem aşağıdaki sürüş davranışlarını tespit edebilmektedir:

| Olay Türü | Açıklama |
|------------|------------|
| Ani Frenleme | Güvenli limitlerin üzerinde yavaşlama |
| Sert Hızlanma | Ani ve agresif hız artışı |
| Keskin Dönüş | Riskli viraj alma davranışı |
| Hız İhlali | Belirlenen limitlerin aşılması |
| Riskli Sürüş | Birden fazla risk göstergesinin oluşması |

---

## 📊 Sürücü Performans Değerlendirmesi

Sistem sürücüleri aşağıdaki kriterlere göre değerlendirir:

- Sürüş güvenliği
- Hız kontrolü
- Frenleme davranışları
- Hızlanma alışkanlıkları
- Olay sıklığı
- Genel sürüş istikrarı

Bu değerlendirmeler sonucunda sürücüye genel bir performans puanı atanır.

---

## 🛠️ Kullanılan Teknolojiler

### Backend

- REST API
- Sunucu tarafı analiz servisleri
- Kimlik doğrulama ve yetkilendirme

### Mobil

- Mobil sensör entegrasyonu
- GPS servisleri
- Gerçek zamanlı veri toplama

### Web

- Yönetim paneli
- Veri görselleştirme
- Raporlama ekranları

### Veritabanı

- Kullanıcı ve sürüş kayıtlarının saklanması
- Analiz verilerinin yönetimi

---

## 📂 Proje Yapısı

```text
Guvenli-Surus-ve-Davranis-Analizi/
│
├── backend-db/     # Veritabanı yapılandırmaları
├── backend/        # API ve analiz servisleri
├── mobil/          # Mobil uygulama
├── web/            # Web yönetim paneli
└── README.md
```

---

## 🚀 Kurulum

### Repoyu Klonlayın

```bash
git clone https://github.com/kullaniciadi/Guvenli-Surus-ve-Davranis-Analizi.git
```

### Backend

```bash
cd backend
npm install
npm start
```

### Mobil Uygulama

```bash
cd mobil
flutter pub get
flutter run
```

### Web Paneli

```bash
cd web
npm install
npm run dev
```

> Not: Komutlar kullanılan teknolojiye göre değişiklik gösterebilir.
---

## 📈 Gelecekte Planlanan Özellikler

- Yapay zeka destekli sürüş analizi
- Sürücü yorgunluk tespiti
- Gerçek zamanlı bildirim sistemi
- Rota güvenlik analizi
- Filo yönetimi entegrasyonu
- Kişiselleştirilmiş sürüş önerileri

---

## 👥 Proje Ekibi

Bu proje, sürüş güvenliği ve akıllı ulaşım sistemleri alanında geliştirilen bir yazılım projesi kapsamında hazırlanmıştır.
