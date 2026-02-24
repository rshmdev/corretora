package com.hydra.studios;

import com.google.gson.Gson;
import lombok.Getter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class App {

	@Getter
	private static Gson gson = new Gson();

	public static void main(String[] args) {
		SpringApplication.run(App.class, args);
	}

}
