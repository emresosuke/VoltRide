# 🚲 VoltRide - Gerçek Zamanlı Bisiklet Kiralama ve Takip Sistemi

VoltRide, elektrikli bisiklet kiralama süreçlerini ve filodaki bisikletlerin anlık konum/şarj durumlarını harita üzerinden gerçek zamanlı (real-time) izleyebileceğiniz modern bir web uygulamasıdır.

Bu proje, güçlü bir **.NET 8 Web API** arka ucu ve modern bir **React** ön yüzü ile geliştirilmiştir. Arka planda çalışan entegre **IoT Simülatörü**, bisikletlerin hareketini ve batarya tüketimini simüle ederek **SignalR** üzerinden anlık olarak haritaya yansıtır.

---

## ✨ Özellikler

- **Gerçek Zamanlı Harita İzleme:** Leaflet.js ve SignalR WebSocket entegrasyonu sayesinde sayfayı yenilemeden bisikletlerin hareketlerini izleyin.
- **Canlı IoT Simülatörü:** Arka planda çalışan (.NET BackgroundService) simülatör, kiradaki bisikletlerin koordinatlarını değiştirir ve şarjlarını düşürür; boştaki bisikletleri ise yavaşça şarj eder.
- **Bisiklet Kiralama & İade:** Kullanıcılar müsait bisikletleri kiralayabilir, kullanım süresi bittikten sonra iade edebilir ve ücret hesaplaması yapılabilir.
- **Modern ve Şık Arayüz:** Glassmorphism tasarım dili, karanlık mod (Dark Mode) desteği ve pürüzsüz mikro-animasyonlarla zenginleştirilmiş React önyüzü.
- **Entity Framework Core & SQLite:** Hızlı kurulum ve kolay test edilebilirlik için SQLite veritabanı kullanılmıştır.

---

## 🛠️ Kullanılan Teknolojiler

### Backend (Arka Yüz)
- **C# / .NET 8.0**
- **ASP.NET Core Web API**
- **SignalR** (Gerçek zamanlı WebSocket iletişimi)
- **Entity Framework Core** (ORM)
- **SQLite** (Veritabanı)

### Frontend (Ön Yüz)
- **React.js** (Vite ile oluşturulmuş)
- **React Leaflet** (İnteraktif harita renderlama)
- **Lucide React** (Modern ikon kütüphanesi)
- **Vanilla CSS3** (Özelleştirilmiş premium tasarım ve animasyonlar)

---

## 🚀 Kurulum ve Çalıştırma

Projeyi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin. (Bilgisayarınızda .NET 8 SDK ve Node.js kurulu olmalıdır).

### 1. Backend (API) Kurulumu

Terminal veya komut satırını açın ve `VoltRide.Api` klasörüne gidin:

```bash
cd VoltRide.Api
```

Gerekli paketleri indirmek ve projeyi başlatmak için şu komutu çalıştırın:

```bash
dotnet run
```
*Not: Proje ilk kez çalıştığında veritabanını (`VoltRide.db`) ve başlangıç verilerini (Diyarbakır/Sur konumlu 3 örnek bisiklet) otomatik olarak oluşturacaktır. API, varsayılan olarak `http://localhost:5288` portunda çalışır.*

### 2. Frontend (React) Kurulumu

Farklı bir terminal sekmesi açın ve `VoltRide.Client` klasörüne gidin:

```bash
cd VoltRide.Client
```

Gerekli NPM paketlerini yükleyin:

```bash
npm install
```

Geliştirici sunucusunu başlatın:

```bash
npm run dev
```
*Not: React uygulaması varsayılan olarak `http://localhost:5173` portunda çalışacaktır. Tarayıcınızdan bu adrese giderek uygulamayı görüntüleyebilirsiniz.*

---

## 📂 Proje Mimarisi Hakkında Önemli Detaylar

- **AsNoTracking ile Performanslı Simülasyon:** `BikeSimulatorService.cs` içerisinde EF Core'un Tracking mekanizması `AsNoTracking()` ile aşılarak, her 5 saniyede bir fiziksel veritabanından saf okuma yapılır. Değişen veriler `EntityState.Modified` ile bilinçli olarak güncellenip SignalR'a aktarılır.
- **CORS ve WebSocket:** React'in (localhost:5173), API ile (localhost:5288) sorunsuz haberleşebilmesi için `Program.cs` içerisinde CORS politikaları ve SignalR Hub rotalamaları (`/bikehub`) yapılandırılmıştır.

---

## 📄 Lisans

Bu proje kişisel gelişim ve portfolyo amacıyla hazırlanmıştır. İstediğiniz gibi çatallayabilir (fork) ve geliştirebilirsiniz.
