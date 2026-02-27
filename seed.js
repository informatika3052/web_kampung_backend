const sequelize = require("./config/database");
const User = require("./models/User");

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    await User.create({
      name: "Administrator",
      email: "admin@kampung.com",
      password: "admin123",
      role: "admin",
    });

    console.log("Database seeded successfully!");
    console.log("Email: admin@kampung.com");
    console.log("Password: admin123");

    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
