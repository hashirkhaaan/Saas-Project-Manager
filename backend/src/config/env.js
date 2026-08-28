const validateEnvironment = () => {
    const requiredVariables = [
        "MONGODB_URI",
        "ACCESS_TOKEN_SECRET",
        "ACCESS_TOKEN_EXPIRY",
        "REFRESH_TOKEN_SECRET",
        "REFRESH_TOKEN_EXPIRY",
        "CORS_ORIGIN",
        "FRONTEND_URL",
        "SESSION_SECRET",
    ];

    const missingVariables = requiredVariables.filter(
        (name) => !process.env[name]?.trim()
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(
                ", "
            )}`
        );
    }

    if (process.env.CORS_ORIGIN.trim() === "*") {
        throw new Error("CORS_ORIGIN must be an exact frontend origin");
    }
};

export { validateEnvironment };
