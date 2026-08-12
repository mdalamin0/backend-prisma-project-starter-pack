import app from "./app";
import config from "./config";
import { transporter } from "./lib/nodemailer";
import { prisma } from "./lib/prisma";
import { redisClient } from "./lib/redis";

const PORT = config.port;
const main = async () => {
  try {
    await prisma.$connect();
    console.log("database connected successfullly!");
    await redisClient.connect();
    console.log("Redis connected successfully.");
    await transporter.verify();
    console.log("Nodemail connected successfully.");
    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}`);
    });
  } catch (error) {
    console.log(`error starting the server: ${error}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
