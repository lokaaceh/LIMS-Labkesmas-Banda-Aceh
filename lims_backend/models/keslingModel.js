const prisma = require("../config/prisma");
const moment = require("moment");
const MasterModel = require("./masterModel");

const KeslingModel = {
  async generateNoReg(kategori) {
    const datePart = moment().format("YYYYMMDD");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const cnt = await prisma.kesling_registrations.count({
      where: {
        kategori: kategori,
        created_at: { gte: startOfDay, lte: endOfDay },
      },
    });

    const prefix = kategori ? kategori.toUpperCase().slice(0, 3) : "KES";
    return `\({prefix}-\){datePart}-${String(cnt + 1).padStart(3, "0")}`;
  },

  async getAll(kategori) {
    const whereClause = kategori ? { kategori } : {};
    const rows = await prisma.kesling_registrations.findMany({
      where: whereClause,
      include: {
        kesling_details: {
          include: {
            master_pemeriksaan: {
              select: { nama_pemeriksaan: true, instalasi_id: true },
            },
          },
        },
        kesling_tests: true,
      },
      orderBy: { created_at: "desc" },
    });
    return rows.map((r) => ({
      ...r,
      total_biaya: Number(r.total_biaya || 0),
      items: r.kesling_tests || [],
    }));
  },

  async getNextSampleSeq(kategori) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const whereClause = {
      created_at: { gte: startOfYear, lte: endOfYear },
    };
    if (kategori) whereClause.kategori = kategori;

    const lastRecord = await prisma.kesling_registrations.findFirst({
      where: whereClause,
      orderBy: { id: "desc" },
      select: { last_sample_seq: true, nomor_sampel: true },
    });

    if (lastRecord) {
      return {
        next_seq: (lastRecord.last_sample_seq || 0) + 1,
        last_sample_string:
          lastRecord.nomor_sampel || "Belum ada data di tahun ini",
      };
    } else {
      return { next_seq: 1, last_sample_string: "Belum ada data registrasi" };
    }
  },

  async findById(id) {
    const registration = await prisma.kesling_registrations.findUnique({
      where: { id: Number(id) },
      include: {
        kesling_details: {
          include: {
            master_pemeriksaan: { select: { nama_pemeriksaan: true } },
          },
        },
        kesling_tests: true,
      },
    });

    if (!registration) return null;
    registration.total_biaya = Number(registration.total_biaya || 0);
    registration.items = registration.kesling_tests || [];
    return registration;
  },

  async checkSampleAvailability(nomor_sampel_string, excludeId = null) {
    if (!nomor_sampel_string) return true;

    const samples = nomor_sampel_string
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (samples.length === 0) return true;

    for (const sample of samples) {
      const conditions = [
        { nomor_sampel: sample },
        { nomor_sampel: { startsWith: `${sample}, ` } },
        { nomor_sampel: { contains: `, ${sample}, ` } },
        { nomor_sampel: { endsWith: `, ${sample}` } },
      ];

      const whereClause = excludeId
        ? { AND: [{ id: { not: Number(excludeId) } }, { OR: conditions }] }
        : { OR: conditions };

      const count = await prisma.kesling_registrations.count({
        where: whereClause,
      });
      if (count > 0) return false;
    }
    return true;
  },

  async create(data) {
    const { items, ...fieldData } = data;

    if (!fieldData.nomor_sampel || fieldData.nomor_sampel.trim() === "") {
      throw new Error("Nomor Sampel Kesling wajib diisi!");
    }
    const nomor_sampel = fieldData.nomor_sampel.trim().toUpperCase();

    const isAvailable = await this.checkSampleAvailability(nomor_sampel);
    if (!isAvailable) {
      throw new Error(`Nomor Sampel "${nomor_sampel}" sudah digunakan.`);
    }

    let max_seq = 0;
    const samples = nomor_sampel.split(",").map((s) => s.trim());
    for (const s of samples) {
      const parts = s.split(" ");
      if (parts.length >= 3) {
        const seqNum = parseInt(parts[parts.length - 3], 10);
        if (!isNaN(seqNum) && seqNum > max_seq) max_seq = seqNum;
      }
    }

    const no_reg = await this.generateNoReg(fieldData.kategori);

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const m = moment(dateStr);
      return m.isValid() ? m.toDate() : null;
    };

    let total_biaya = 0;
    let validItems = [];

    if (items && items.length > 0) {
      const uniqueIds = [...new Set(items.map((i) => i.id).filter(Boolean))];
      if (uniqueIds.length > 0) {
        const masterData = await MasterModel.getPemeriksaanByIds(uniqueIds);
        validItems = items
          .map((reqItem) => {
            const master = masterData.find((m) => m.id == reqItem.id);
            if (!master) return null;
            return { ...master, qty: reqItem.qty || 1 };
          })
          .filter(Boolean);

        total_biaya = validItems.reduce(
          (sum, item) => sum + Number(item.harga || 0) * (item.qty || 1),
          0,
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      const reg = await tx.kesling_registrations.create({
        data: {
          no_reg,
          kategori: fieldData.kategori || "kesling_ppc",
          nama_pelanggan: fieldData.nama_pelanggan,
          alamat_pelanggan: fieldData.alamat_pelanggan || null,
          no_telepon: fieldData.no_telepon || null,
          pengujian: fieldData.pengujian || null,
          nomor_sampel: nomor_sampel,
          kondisi_sampel: fieldData.kondisi_sampel || "Baik",
          asal_sampel: fieldData.asal_sampel || "Mandiri",
          kode_laboratorium: fieldData.kode_laboratorium || null,
          tempat_analisa:
            fieldData.tempat_analisa || "Laboratorium Kesling BLKM",
          tgl_penerimaan: parseDate(fieldData.tgl_penerimaan) || new Date(),
          is_sample_picked_up: Boolean(fieldData.is_sample_picked_up),
          status: "terdaftar",
          total_biaya: total_biaya,
          catatan: fieldData.catatan || null,
          petugas_input: fieldData.petugas_input || null,
          last_sample_seq: max_seq,
        },
      });

      if (validItems.length > 0) {
        for (const item of validItems) {
          // Simpan ke kesling_details (relasi ke master_pemeriksaan)
          await tx.kesling_details.create({
            data: {
              kesling_registration_id: reg.id,
              pemeriksaan_id: item.id,
              harga_saat_ini: item.harga,
            },
          });

          // Ambil parameter jika tipe paket, atau gunakan data satuan
          let testParameters = [];
          if (
            item.tipe === "paket" &&
            item.parameters &&
            item.parameters.length > 0
          ) {
            testParameters = item.parameters;
          } else {
            testParameters.push({
              parameter_name: item.nama_pemeriksaan,
              satuan: item.satuan,
              nilai_rujukan: item.nilai_rujukan,
              deskripsi_rujukan: item.deskripsi_rujukan,
              metode: item.metode,
            });
          }

          // Simpan parameter uji ke kesling_tests
          for (let i = 0; i < item.qty; i++) {
            for (const param of testParameters) {
              const finalParamName =
                item.qty > 1
                  ? `\({param.parameter_name} #\){i + 1}`
                  : param.parameter_name;

              await tx.kesling_tests.create({
                data: {
                  kesling_registration_id: reg.id,
                  pemeriksaan_name: item.nama_pemeriksaan,
                  parameter_name: finalParamName,
                  satuan: param.satuan || null,
                  nilai_rujukan: param.nilai_rujukan || null,
                  deskripsi_rujukan:
                    param.deskripsi_rujukan || item.deskripsi_rujukan || null,
                  metode: param.metode || null,
                  status: "pending",
                },
              });
            }
          }
        }
      }

      return { id: reg.id, no_reg: no_reg };
    });
  },

  async delete(id) {
    try {
      await prisma.kesling_registrations.delete({ where: { id: Number(id) } });
      return true;
    } catch {
      return false;
    }
  },

  async search(query, kategori) {
    const whereClause = {
      OR: [
        { nama_pelanggan: { contains: query } },
        { no_reg: { contains: query } },
        { nomor_sampel: { contains: query } },
      ],
    };
    if (kategori) whereClause.kategori = kategori;

    const rows = await prisma.kesling_registrations.findMany({
      where: whereClause,
      include: {
        kesling_details: true,
        kesling_tests: true,
      },
      orderBy: { created_at: "desc" },
    });
    return rows.map((r) => ({ ...r, total_biaya: Number(r.total_biaya || 0) }));
  },
};

module.exports = KeslingModel;
