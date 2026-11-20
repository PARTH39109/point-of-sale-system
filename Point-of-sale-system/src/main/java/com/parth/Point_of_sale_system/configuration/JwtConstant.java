package com.parth.Point_of_sale_system.configuration;

public class JwtConstant {
    public static final String JWT_HEADER = "Authorization";

    // Non-sensitive development fallback secret - override via JWT_SECRET env var or application-local.properties
    private static final String DEFAULT_DEV_SECRET = "POS_SYSTEM_DEFAULT_DEVELOPMENT_SECRET_KEY_REPLACE_IN_PRODUCTION_ENV_256_BITS";

    private static volatile String activeSecret = resolveInitialSecret();

    public static String getSecret() {
        return activeSecret;
    }

    public static void setSecret(String secret) {
        if (secret != null && !secret.isBlank()) {
            activeSecret = secret;
        }
    }

    private static String resolveInitialSecret() {
        String env = System.getenv("JWT_SECRET");
        if (env != null && !env.isBlank()) {
            return env;
        }
        String prop = System.getProperty("jwt.secret");
        if (prop != null && !prop.isBlank()) {
            return prop;
        }
        return DEFAULT_DEV_SECRET;
    }

    public static final String JWT_SECRET = resolveInitialSecret();
}
