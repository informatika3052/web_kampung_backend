const sequelize = require("./config/database");
const { User, Transaction } = require("./models");
const bcrypt = require("bcryptjs");

async function seedData() {
  try {
    console.log("🌱 Seeding data...");

    // Buat user admin
    const admin = await User.create({
      name: "Admin Utama",
      email: "admin@kampung.com",
      password: "admin123",
      role: "admin",
    });

    // Buat data dummy transaksi 6 bulan terakhir
    const now = new Date();
    const dummyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const tanggal = date.toISOString().split("T")[0];

      // Pemasukan
      dummyData.push({
        date: tanggal,
        jenis_iuran: "kas_bulanan",
        nama_warga: "Budi Santoso",
        amount: 50000,
        type: "income",
        keterangan: "Iuran bulanan",
        created_by: admin.id,
      });

      dummyData.push({
        date: tanggal,
        jenis_iuran: "kas_kematian",
        nama_warga: "Siti Aminah",
        amount: 20000,
        type: "income",
        keterangan: "Iuran kas kematian",
        created_by: admin.id,
      });

      // Pengeluaran
      dummyData.push({
        date: tanggal,
        jenis_iuran: "kas_sosial",
        nama_warga: "RT 01",
        amount: 75000,
        type: "expense",
        keterangan: "Beli snack rapat",
        created_by: admin.id,
      });
    }

    await Transaction.bulkCreate(dummyData);
    console.log(`✅ Berhasil menambah ${dummyData.length} data dummy`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    process.exit();
  }
}

seedData();
