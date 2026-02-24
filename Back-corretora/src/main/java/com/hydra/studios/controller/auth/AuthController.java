package com.hydra.studios.controller.auth;

import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.controller.response.ResponseModal;
import com.hydra.studios.service.auth.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public String login(@RequestBody String requestBody) {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        String email = body.get("email").getAsString();
        String password = body.get("password").getAsString();

        var response = authService.login(email, password);

        if (response == null) {
            return App.getGson().toJson(
                    ResponseModal.builder().status(false).message("Invalid credentials").build()
            );
        }

        return App.getGson().toJson(
                ResponseModal.builder().status(true).message("Login successful").data(response).build()
        );
    }

    @PostMapping("/register")
    public String register(@RequestBody String requestBody) {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        String firstName = body.get("firstName").getAsString();
        String lastName = body.get("lastName").getAsString();
        String email = body.get("email").getAsString();
        String password = body.get("password").getAsString();
        String phone = body.get("phone").getAsString();
        String referralCode = body.has("referralCode") ? body.get("referralCode").getAsString() : null;

        var response = authService.register(firstName, lastName, phone, email, password, referralCode);

        if (response != null) {
            return App.getGson().toJson(
                    ResponseModal.builder().status(false).message(response).build()
            );
        }

        var login = authService.login(email, password);

        return App.getGson().toJson(
                ResponseModal.builder().status(true).message("Registration successful").data(login).build()
        );
    }

    @PostMapping("/verify")
    public String verify(@RequestBody String requestBody) {
        var token = JsonParser.parseString(requestBody).getAsJsonObject().get("token").getAsString();

        return authService.verify(token);
    }
}
