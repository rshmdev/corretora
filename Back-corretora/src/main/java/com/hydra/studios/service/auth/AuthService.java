package com.hydra.studios.service.auth;

import com.google.gson.JsonObject;
import com.hydra.studios.App;
import com.hydra.studios.component.jwt.JWTComponent;
import com.hydra.studios.controller.response.ResponseModal;
import com.hydra.studios.model.account.Account;
import com.hydra.studios.model.account.affiliate.AccountAffiliate;
import com.hydra.studios.model.account.personal.AccountPersonalInfo;
import com.hydra.studios.model.account.role.AccountRole;
import com.hydra.studios.model.account.wallet.AccountWallet;
import com.hydra.studios.model.activity.type.ActivityLogType;
import com.hydra.studios.repository.account.AccountRepository;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.activity.ActivityService;
import com.hydra.studios.ws.controller.AccController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private JWTComponent jwt;

    @Autowired
    private AuthenticationManager manager;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private AccController accController;

    public String login(String email, String password) {
        try {
            manager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            return null;
        }

        var account = accountService.getAccount(email);
        final UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        var object = new JsonObject();

        object.addProperty("email", account.getEmail());
        object.addProperty("password", "***********");

        activityService.createActivityLog(account.getId(), "LOGIN", object.toString());

        var token = jwt.generateToken(userDetails.getUsername());

        account.setLastLogin(System.currentTimeMillis());


        accController.publish(account.getId(), account);
        accountService.save(account);

        return token;
    }

    public String register(String firstName, String lastName, String phone, String email, String password, String referralCode) {
        var account = Account.builder()
                .id(UUID.randomUUID().toString())
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(encoder.encode(password))
                .personalInfo(new AccountPersonalInfo())
                .role(AccountRole.USER)
                .affiliate(new AccountAffiliate())
                .wallet(new AccountWallet())
                .referralCode(referralCode)
                .firstLogin(System.currentTimeMillis())
                .lastLogin(System.currentTimeMillis())
                .build();

        account.getPersonalInfo().setPhone(phone);

        var found = accountService.getAccount(email);
        if (found != null) {
            return "This account already exists with this email";
        }

        found = accountService.getAccountByPhone(phone);

        if (found != null) {
            return "This account already exists with this phone";
        }

        if (password.length() < 6) {
            return "Password is too short";
        }

        if (password.length() > 30) {
            return "Password is too long";
        }

        if (phone.length() < 10) {
            return "Phone is too short";
        }

        if (referralCode != null) {
            var aff = accountService.getAccountByAffiliateId(referralCode);

            if (aff == null) {
                return "Invalid referral code";
            }

            if (aff.getRole() != AccountRole.AFFILIATE && aff.getRole() != AccountRole.ADMIN) {
                return "Invalid referral code";
            }
        }

        accController.publish(account.getId(), account);
        accountService.save(account);
        return null;
    }

    public String verify(String token) {
        var email = jwt.extractUsername(token);
        var account = accountService.getAccount(email);

        if (account == null) {
            return App.getGson().toJson(
                    ResponseModal.builder().status(false).message("Invalid token").build()
            );
        }

        if (!jwt.validateToken(token, email)) {
            return App.getGson().toJson(
                    ResponseModal.builder().status(false).message("Invalid token").build()
            );
        }

        return App.getGson().toJson(
                ResponseModal.builder().status(true).message("Token is valid").data(token).build()
        );
    }

}
