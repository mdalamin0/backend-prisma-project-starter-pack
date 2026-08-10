import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const PORT = config.port;
const main = async () => {
  try {
    await prisma.$connect();
    console.log("database connected successfullly!");
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
