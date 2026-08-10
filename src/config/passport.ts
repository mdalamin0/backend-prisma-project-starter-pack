import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";
import { prisma } from "../lib/prisma";
import { AuthProvider, Role, UserStatus } from "../../generated/prisma/enums";
import bcrypt from "bcryptjs";
import config from ".";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        if (user.status === UserStatus.SUSPENDED) {
          return done(null, false, {
            message: "User is suspended!",
          });
        }

        if (user.provider === AuthProvider.GOOGLE && !user.password) {
          return done(null, false, {
            message:
              "This account is registered with Google. Please login with Google.",
          });
        }

        const isPasswordMatched = await bcrypt.compare(
          password,
          user.password!,
        );

        if (!isPasswordMatched) {
          return done(null, false, {
            message: "Invalid email or password",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id,
      clientSecret: config.google_client_secret,
      callbackURL: config.google_callback_url,
    },

    async (accessToken, refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: "Google account email not found",
          });
        }

        // 1. Check existing Google user
        const existingGoogleUser = await prisma.user.findFirst({
          where: {
            email,
            googleId: profile.id,
          },
        });

        let user = existingGoogleUser;

        // 2. Google user doesn't exist
        if (!existingGoogleUser) {
          // 3. Check existing credential user
          const existingCredentialsUser = await prisma.user.findFirst({
            where: {
              email,
              provider: AuthProvider.CREDENTIAL,
            },
          });

          
          if (existingCredentialsUser) {
            if (existingCredentialsUser.status === UserStatus.SUSPENDED) {
              return done(null, false, {
                message: "User is suspended",
              });
            }

            user = await prisma.user.update({
              where: {
                id: existingCredentialsUser.id,
              },
              data: {
                googleId: profile.id,
                image: profile.photos?.[0]?.value,
                emailVerified: true,
              },
            });
          }

          // 5. Completely new Google user
          else {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email,
                role: Role.USER,
                googleId: profile.id,
                provider: AuthProvider.GOOGLE,
                emailVerified: true,
                image: profile.photos?.[0]?.value,
              },
            });
          }
        }

        // 6. Make sure user exists
        if (!user) {
          return done(null, false, {
            message: "User not found!",
          });
        }

        // 7. Check account status
        if (user.status === UserStatus.SUSPENDED) {
          return done(null, false, {
            message: "User is suspended!",
          });
        }

      
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
