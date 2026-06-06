const Device = require('../models/Device');

// @desc    Yeni cihaz kaydet
// @route   POST /api/devices
// @access  Private
const registerDevice = async (req, res) => {
  try {
    const { label, platform, model, appVersion } = req.body;

    if (!label || !platform) {
      return res.status(400).json({ message: 'Etiket ve platform zorunludur' });
    }

    const device = await Device.create({
      userId: req.user._id,
      label,
      platform,
      model,
      appVersion,
    });

    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kullanıcının cihazlarını listele
// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Belirli bir cihazı getir
// @route   GET /api/devices/:id
// @access  Private
const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Cihazın kullanıcıya ait olup olmadığını kontrol et
    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihaza erişim yetkiniz yok' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cihaz güncelle
// @route   PUT /api/devices/:id
// @access  Private
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihazı güncelleme yetkiniz yok' });
    }

    const { label, platform, model, appVersion } = req.body;

    device.label = label || device.label;
    device.platform = platform || device.platform;
    device.model = model !== undefined ? model : device.model;
    device.appVersion = appVersion !== undefined ? appVersion : device.appVersion;
    device.lastSeenAt = new Date();

    const updated = await device.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cihaz sil
// @route   DELETE /api/devices/:id
// @access  Private
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    if (device.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bu cihazı silme yetkiniz yok' });
    }

    await device.deleteOne();
    res.json({ message: 'Cihaz başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Son görülme zamanını güncelle (heartbeat)
// @route   PATCH /api/devices/:id/heartbeat
// @access  Private
const heartbeat = async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { lastSeenAt: new Date() },
      { new: true },
    );

    if (!device) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    res.json({ lastSeenAt: device.lastSeenAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerDevice, getDevices, getDeviceById, updateDevice, deleteDevice, heartbeat };