package com.devscore.ai.SpringBootBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean; // <--- Import this
import org.springframework.web.reactive.function.client.WebClient;
@SpringBootApplication
public class SpringBootBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringBootBackendApplication.class, args);
	}

	@Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

}
