const KeslingModel = require("../models/keslingModel");
const prisma = require("../config/prisma");

exports.getAllKeslingRegistrations = async (req, res) => {
  try {
    const { kategori, search } = req.query;
    let rows;
    if (search) {
      rows = await KeslingModel.search(search, kategori);
    } else {
      rows = await KeslingModel.getAll(kategori);
    }
    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("Error getting kesling registrations:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getKeslingRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await KeslingModel.findById(id);
    if (!registration) {
      return res
        .status(404)
        .json({ success: false, message: "Data tidak ditemukan" });
    }
    res.json({ success: true, data: registration });
  } catch (err) {
    console.error("Error getting kesling registration by ID:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.checkSampleNo = async (req, res) => {
  try {
    const { no_sampel } = req.params;
    const { excludeId } = req.query;
    if (!no_sampel) {
      return res
        .status(400)
        .json({ success: false, message: "Nomor sampel kosong" });
    }
    const cleanNo = no_sampel.trim().toUpperCase();
    const available = await KeslingModel.checkSampleAvailability(
      cleanNo,
      excludeId,
    );
    res.json({
      success: true,
      available: available,
      message: available ? "Tersedia" : "Sudah digunakan",
    });
  } catch (err) {
    console.error("Check sample kesling error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getNextSampleSeq = async (req, res) => {
  try {
    const { kategori } = req.query;
    const result = await KeslingModel.getNextSampleSeq(kategori);
    res.json({
      success: true,
      next_seq: result.next_seq,
      last_sample_string: result.last_sample_string,
    });
  } catch (err) {
    console.error("Gagal mendapatkan nomor urut kesling:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createKeslingRegistration = async (req, res) => {
  try {
    const data = req.body;
    const user = req.user;

    if (!data.petugas_input) {
      data.petugas_input = user?.fullname || "Staff Kesling";
    }

    if (data.tgl_penerimaan) {
      data.tgl_penerimaan = new Date(`${data.tgl_penerimaan}T12:00:00+07:00`);
    }

    const result = await KeslingModel.create(data);
    res.status(201).json({
      success: true,
      message: "Registrasi Kesling berhasil disimpan",
      data: result,
    });
  } catch (err) {
    console.error("Error creating kesling registration:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + err.message });
  }
};

exports.deleteKeslingRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    await KeslingModel.delete(id);
    res.json({ success: true, message: "Registrasi Kesling berhasil dihapus" });
  } catch (err) {
    console.error("Error deleting kesling registration:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
