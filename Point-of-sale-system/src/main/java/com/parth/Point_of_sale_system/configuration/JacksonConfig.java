package com.parth.Point_of_sale_system.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.format.DateTimeFormatter;

/**
 * Serializes LocalDateTime as "2026-07-18T10:52:00Z" (with Z suffix).
 *
 * Without the Z, JavaScript's new Date("2026-07-18T04:55:00") treats the
 * string as LOCAL time and does not convert to IST — so the time shown
 * in the browser is wrong.
 *
 * With Z, new Date("2026-07-18T04:55:00Z") is parsed as UTC and
 * toLocaleString('en-IN') correctly converts it to IST (+5:30).
 *
 * No changes to application.properties or DB timezone needed.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        JavaTimeModule module = new JavaTimeModule();

        // Append 'Z' to LocalDateTime so JS treats it as UTC
        module.addSerializer(
                java.time.LocalDateTime.class,
                new LocalDateTimeSerializer(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"))
        );

        return new ObjectMapper()
                .registerModule(module)
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}