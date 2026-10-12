// models/testModel.js
const prisma = require("../config/prisma");

const TestModel = {
  async createTest(registration_id, data) {
    const status = data.nilai ? "completed" : "pending";

    const test = await prisma.registration_tests.create({
      data: {
        registration_id: Number(registration_id),
        parameter_name: data.parameter_name,
        nilai: data.nilai || null,
        satuan: data.satuan || null,
        range_normal: data.range_normal || null,
        nilai_rujukan: data.nilai_rujukan || null,
        deskripsi_rujukan: data.deskripsi_rujukan || null,
        status: status,
      },
    });
    return test;
  },

  // // Menarik data lengkap pasien/registrasi terkait
  async getRegistrationsByParameter(parameterName) {
    return await prisma.registration_tests.findMany({
      where: {
        parameter_name: {
          contains: parameterName,
        },
      },
      include: {
        registrations: true,
      },
      orderBy: { created_at: "desc" },
    });
  },

  async getByRegistration(registration_id) {
    return await prisma.registration_tests.findMany({
      where: { registration_id: Number(registration_id) },
      orderBy: { id: "asc" },
    });
  },

  async updateTest(testId, data) {
    const updateData = { ...data };
    delete updateData.id;

    return await prisma.registration_tests.update({
      where: { id: Number(testId) },
      data: updateData,
    });
  },

  async findById(testId) {
    return await prisma.registration_tests.findUnique({
      where: { id: Number(testId) },
    });
  },

  async validateTest(testId, data) {
    return await prisma.registration_tests.update({
      where: { id: Number(testId) },
      data: {
        validation_status: data.validation_status,
        validated_by: data.validated_by,
        validation_note: data.validation_note || null,
        validated_at: new Date(),
      },
    });
  },

  async getTestsByRegistrationId(registrationId) {
    const tests = await prisma.registration_tests.findMany({
      where: { registration_id: Number(registrationId) },
      include: {
        users: { select: { username: true } },
        registrations: { select: { jenis_kelamin: true } },
      },
      orderBy: { id: "asc" },
    });

    // cek data
    const enrichedTests = await Promise.all(
      tests.map(async (t) => {
        // Cek prioritas ke master parameter anak (untuk paket) atau master utama (untuk satuan)
        let deskripsi_rujukan = null;
        let nilai_rujukan = null;

        const masterParam =
          await prisma.master_pemeriksaan_parameters.findFirst({
            where: { parameter_name: t.parameter_name },
          });

        if (masterParam && masterParam.deskripsi_rujukan) {
          deskripsi_rujukan = masterParam.deskripsi_rujukan;
          nilai_rujukan = masterParam.nilai_rujukan;
        } else {
          const masterMain = await prisma.master_pemeriksaan.findFirst({
            where: {
              OR: [
                { nama_pemeriksaan: t.parameter_name },
                { nama_pemeriksaan: t.pemeriksaan_name },
              ],
            },
          });
          deskripsi_rujukan =
            masterMain?.deskripsi_rujukan || t.deskripsi_rujukan;
          nilai_rujukan = masterMain?.nilai_rujukan || t.nilai_rujukan;
        }

        return {
          ...t,
          deskripsi_rujukan,
          nilai_rujukan,
          validator_name: t.users?.username || null,
          jenis_kelamin: t.registrations?.jenis_kelamin || "L",
          users: undefined,
          registrations: undefined,
        };
      }),
    );

    return enrichedTests;
  },

  async areAllTestsValidated(registrationId) {
    const tests = await prisma.registration_tests.findMany({
      where: { registration_id: Number(registrationId) },
      select: { validation_status: true },
    });

    const total = tests.length;
    const approved = tests.filter(
      (t) => t.validation_status === "approved",
    ).length;
    const rejected = tests.filter(
      (t) => t.validation_status === "rejected",
    ).length;

    return { total, approved, rejected };
  },
};

module.exports = TestModel;
