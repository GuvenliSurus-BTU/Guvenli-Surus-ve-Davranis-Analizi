# NamazApp - Mobil Sensör İstemcisi (Flutter)

Bu proje, telefonun ivmeölçer, jiroskop ve GPS (konum) verilerini toplayarak arka planda belirli bir sunucuya iletmek üzere geliştirilmiştir.

## ⚠️ Geliştiricilerin Dikkatine: API Endpoint Değişikliği ve Gereksinimler

Mobil uygulama tarafından her 5 saniyede bir gönderilen sensör verilerini karşılamak için **Backend tarafında özel bir endpoint'e ihtiyaç vardır.** 

### 1. Varsayılan Sunucu Adresi (URL)
Şu an kaynak koddaki varsayılan hedef sunucu adresi, uygulamanın kurulu olduğu bilgisayarın IP'sine (USB bağlantısı ve Wi-Fi testi için) ayarlanmıştır:
`http://192.168.1.2:3000/api/sensor`

*Eğer farklı bir yerel ağda (Wi-Fi) iseniz veya uygulamayı canlı bir sunucuya bağlayacaksanız, uygulamanın ana ekranındaki metin kutusundan (Sunucu URL) bu IP adresini ve portu güncellemeniz gerekmektedir.*

### 2. Backend Geliştiricileri İçin Gerekli İşlem
Şu anda backend tarafında (`server.ts`) sensör verilerini karşılayan bir `/api/sensor` uç noktası (endpoint) **bulunmamaktadır**. Mobil uygulamanın `TimeoutException` (Bağlantı Zaman Aşımı) hatası atmaması ve verilerin başarıyla iletilebilmesi için backend projenize aşağıdaki gibi bir POST route'u eklemeniz gerekmektedir:

```typescript
app.post('/api/sensor', (req, res) => {
  // Mobil uygulamadan gelen payload:
  // {
  //   timestamp: string,
  //   accelerometer: { x, y, z },
  //   gyroscope: { x, y, z },
  //   location: { latitude, longitude, altitude, accuracy } | null
  // }
  console.log('[Sensor Data Gelen Veri]', JSON.stringify(req.body, null, 2));
  
  res.json({ success: true, message: 'Sensor verisi alındı' });
});
```

Eğer verileri `/api/sensor` yerine farklı bir adreste karşılayacaksanız (örneğin `/api/data`), uygulamanın "Sunucu URL" kutucuğundan adresi `http://<IP>:3000/api/data` şeklinde güncellemeyi unutmayın!

### 3. USB Kablosu ile Hata Ayıklama (Localhost)
Eğer telefonu USB ile bilgisayara bağladıysanız ve verilerin direkt olarak Wi-Fi olmadan USB kablosu üzerinden PC'ye (localhost) ulaşmasını istiyorsanız;
Terminalden şu komutu çalıştırın:
`adb reverse tcp:3000 tcp:3000`
Bunu yaptıktan sonra mobil uygulamada adres olarak `http://127.0.0.1:3000/api/sensor` kullanabilirsiniz.

---
## Uygulama İzinleri Bilgisi
Android 14+ kuralları gereği uygulama başlatıldığında:
1. Bildirim İzni
2. Konum (Uygulamayı Kullanırken) İzni
3. Arka Plan Konum (Her Zaman) İzni 
kademeli olarak sorulmaktadır. Servisin sağlıklı çalışması için bu izinlerin eksiksiz verilmesi şarttır.
