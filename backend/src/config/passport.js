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
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = await User.findOne({
                        email: profile.emails[0].value,
                    });
                    if (user) {
                        user.googleId = profile.id;
                        await user.save({ validateBeforeSave: false });
                    } else {
                        user = await User.create({
                            googleId: profile.id,
                            fullName: profile.displayName,
                            username: profile.emails[0].value
                                .split("@")[0]
                                .replace(/[^a-zA-Z0-9]/g, ""),
                            email: profile.emails[0].value,
                            avatar: {
                                url: profile.photos[0].value,
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
