import dotenv from "dotenv";
import path from "path";


dotenv.config({path: path.join(process.cwd(), ".env")})


export default {
  port: process.env.PORT,
  app_url: process.env.APP_URL,
  node_env: process.env.NODE_ENV,
  frontend_url: process.env.FRONTEND_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS!,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  ssl_commerz_store_id: process.env.SSL_COMMERZ_STORE_ID,
  ssl_commerz_store_password: process.env.SSL_COMMERZ_STORE_PASSWORD,
  google_client_id: process.env.GOOGLE_CLIENT_ID!,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL!,
};