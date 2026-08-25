import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const providerEmail = profile.emails
                    ?.find((email) => email.verified === true)
                    ?.value?.trim()
                    .toLowerCase();

                if (!providerEmail) {
                    return done(
                        new Error("Google account has no verified email")
                    );
                }

                const avatarUrl = profile.photos?.[0]?.value || "";

                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = await User.findOne({ email: providerEmail });

                    if (user) {
                        user.googleId = profile.id;
                        await user.save({ validateBeforeSave: false });
                    } else {
                        const baseUsername = providerEmail
                            .split("@")[0]
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .toLowerCase();

                        let username = baseUsername || `google-${profile.id}`;
                        let suffix = 0;

                        while (await User.exists({ username })) {
                            suffix += 1;
                            username = `${baseUsername || `google-${profile.id}`}${suffix}`;
                        }

                        user = await User.create({
                            googleId: profile.id,
                            fullName: profile.displayName || providerEmail,
                            username,
                            email: providerEmail,
                            avatar: {
                                url: avatarUrl,
                                public_id: "",
                            },
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

export default passport;
