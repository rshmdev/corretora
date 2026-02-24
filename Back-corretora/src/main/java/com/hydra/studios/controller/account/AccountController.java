package com.hydra.studios.controller.account;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.controller.response.ResponseModal;
import com.hydra.studios.model.account.personal.address.country.AccountPersonalCountry;
import com.hydra.studios.model.account.personal.gender.AccountPersonalGender;
import com.hydra.studios.model.affiliate.AffiliateLog;
import com.hydra.studios.model.affiliate.revenue.AffiliateRevenueType;
import com.hydra.studios.model.affiliate.type.AffiliateType;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.activity.ActivityService;
import com.hydra.studios.service.affiliate.AffiliateService;
import com.hydra.studios.service.bet.BetService;
import com.hydra.studios.service.system.SystemService;
import com.hydra.studios.service.transaction.TransactionService;
import com.hydra.studios.ws.controller.AccController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/v1/account")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private AccController accController;

    @Autowired
    private BetService betService;

    @Autowired
    private AffiliateService affiliateService;

    @Autowired
    private SystemService systemService;

    @GetMapping
    public String find(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var response = JsonParser.parseString(App.getGson().toJson(account)).getAsJsonObject();

        response.remove("password");

        return App.getGson().toJson(ResponseModal.builder().status(true).data(response).build());
    }

    @GetMapping("/activity")
    public String activity(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var activities = activityService.getAllActivitiesByAccount(account.getId());

        return App.getGson().toJson(ResponseModal.builder().status(true).data(activities).build());
    }

    @GetMapping("/active-trading")
    public String activeTrading(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var bets = betService.getBetsByAccountIdAndNotFinished(account.getId());

        var array = new JsonArray();

        for (var bet : bets) {
            var obj = JsonParser.parseString(App.getGson().toJson(bet)).getAsJsonObject();
            obj.addProperty("secondsLeft", (bet.getFinishIn() - System.currentTimeMillis()) / 1000);
            array.add(obj);
        }

        return App.getGson().toJson(ResponseModal.builder().status(true).data(array).build());
    }

    @GetMapping("/history-trading")
    public String history(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var bets = betService.getBetsByAccountId(account.getId());

        return App.getGson().toJson(ResponseModal.builder().status(true).data(bets).build());
    }

    @GetMapping("/affiliate")
    public String affiliate(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        if (account.getRole() != com.hydra.studios.model.account.role.AccountRole.AFFILIATE
                && account.getRole() != com.hydra.studios.model.account.role.AccountRole.ADMIN) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("You are not an affiliate").build());
        }

        if (account.getAffiliate().getAffiliateId() == null) {
            account.getAffiliate().setAffiliateId(UUID.randomUUID().toString());
            accController.publish(account.getId(), account);
            accountService.save(account);
        }

        var config = systemService.getSystem();

        var affLogs = affiliateService.findByAffiliateId(account.getId());
        var accounts = accountService.getAllAccountsByReferralCode(account.getAffiliate().getAffiliateId());

        var totalEarnings = affLogs.stream().mapToDouble(AffiliateLog::getTotalWin).sum();
        var availableBalance = account.getWallet().getAffiliate();

        var url = config.getUrl() + "/aff?ref=" + account.getAffiliate().getAffiliateId();
        var affiliateId = account.getAffiliate().getAffiliateId();

        var obj = new JsonObject();

        obj.addProperty("affiliateId", affiliateId);
        obj.addProperty("url", url);

        obj.addProperty("totalReferrals", accounts.size());
        obj.addProperty("totalEarnings", totalEarnings);
        obj.addProperty("availableBalance", availableBalance);

        obj.addProperty("cpa", account.getAffiliate().getCpa());
        obj.addProperty("percentPerDeposit", account.getAffiliate().getPercentPerDeposit());
        obj.addProperty("revshare", account.getAffiliate().getRevenueShare());
        obj.addProperty("sub_affiliate_revenue",
                affLogs.stream().filter(log -> log.getRevenueType() == AffiliateRevenueType.SUB_AFFILIATE)
                        .mapToDouble(AffiliateLog::getTotalWin).sum());

        obj.add("logs", JsonParser.parseString(App.getGson().toJson(affLogs)).getAsJsonArray());

        return App.getGson().toJson(ResponseModal.builder().status(true).data(obj).build());
    }

    @PostMapping("/edit")
    public String edit(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String requestBody) {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        var account = accountService.getAccount(userDetails.getUsername());

        var changedFields = new JsonObject();

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        if (body.has("cpf")) {
            var cpf = checkCpf(body.get("cpf").getAsString());

            if (!cpf) {
                return App.getGson().toJson(ResponseModal.builder().status(false).message("Invalid CPF").build());
            }

            changedFields.addProperty("previous_cpf", account.getPersonalInfo().getCpf());
            changedFields.addProperty("new_cpf", body.get("cpf").getAsString());

            account.getPersonalInfo().setCpf(body.get("cpf").getAsString());
        }

        if (body.has("phone")) {
            changedFields.addProperty("previous_phone", account.getPersonalInfo().getPhone());
            changedFields.addProperty("new_phone", body.get("phone").getAsString());

            account.getPersonalInfo().setPhone(body.get("phone").getAsString());
        }

        if (body.has("dateOfBirth")) {
            changedFields.addProperty("previous_dateOfBirth", account.getPersonalInfo().getDateOfBirth());
            changedFields.addProperty("new_dateOfBirth", body.get("dateOfBirth").getAsString());

            account.getPersonalInfo().setDateOfBirth(body.get("dateOfBirth").getAsString());
        }

        if (body.has("gender")) {
            var gender = body.get("gender").getAsString();

            changedFields.addProperty("previous_gender", account.getPersonalInfo().getGender().getText());
            changedFields.addProperty("new_gender", AccountPersonalGender.valueOf(gender).getText());

            account.getPersonalInfo().setGender(AccountPersonalGender.valueOf(gender));
        }

        if (body.has("address")) {
            var address = body.getAsJsonObject("address");
            if (address.has("country")) {
                var country = address.get("country").getAsString();

                changedFields.addProperty("previous_country",
                        account.getPersonalInfo().getAddress().getCountry().name());
                changedFields.addProperty("new_country", AccountPersonalCountry.valueOf(country).name());

                account.getPersonalInfo().getAddress().setCountry(AccountPersonalCountry.valueOf(country));
            }

            if (address.has("city")) {

                changedFields.addProperty("previous_city", account.getPersonalInfo().getAddress().getCity());
                changedFields.addProperty("new_city", address.get("city").getAsString());

                account.getPersonalInfo().getAddress().setCity(address.get("city").getAsString());
            }

            if (address.has("state")) {
                changedFields.addProperty("previous_state", account.getPersonalInfo().getAddress().getState());
                changedFields.addProperty("new_state", address.get("state").getAsString());

                account.getPersonalInfo().getAddress().setState(address.get("state").getAsString());
            }

            if (address.has("zipCode")) {
                changedFields.addProperty("previous_zipCode", account.getPersonalInfo().getAddress().getZipCode());
                changedFields.addProperty("new_zipCode", address.get("zipCode").getAsString());

                account.getPersonalInfo().getAddress().setZipCode(address.get("zipCode").getAsString());
            }

            if (address.has("street")) {
                changedFields.addProperty("previous_street", account.getPersonalInfo().getAddress().getStreet());
                changedFields.addProperty("new_street", address.get("street").getAsString());

                account.getPersonalInfo().getAddress().setStreet(address.get("street").getAsString());
            }
        }

        activityService.createActivityLog(account.getId(), "UPDATE_PROFILE", changedFields.toString());
        accController.publish(account.getId(), account);
        accountService.save(account);

        return App.getGson().toJson(ResponseModal.builder().status(true).message("Account updated").build());
    }

    @PostMapping("/deposit")
    public String deposit(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String requestBody)
            throws IOException {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        if (!body.has("amount")) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Amount is required").build());
        }

        double amount = body.get("amount").getAsDouble();

        if (amount <= 0) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Amount must be greater than zero").build());
        }

        if (account.getPersonalInfo().getCpf().isEmpty()) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("CPF is required to make a deposit").build());
        }

        var response = transactionService.createTransaction(account, amount, 0);

        return App.getGson().toJson(response);
    }

    @GetMapping("/deposit/{transactionId}")
    public String getDeposit(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String transactionId) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var transaction = transactionService.getTransactionById(transactionId);

        if (transaction == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Transaction not found").build());
        }

        if (!transaction.getAccountId().equals(account.getId())) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Transaction not found").build());
        }

        return App.getGson().toJson(ResponseModal.builder().status(true).data(transaction).build());
    }

    @PostMapping("/deposit/{transactionId}/callback")
    public String depositCallback(@PathVariable String transactionId, @RequestBody String requestBody) {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        System.out.println(body.toString());
        var transaction = transactionService.getTransactionById(transactionId);

        if (transaction == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Transaction not found").build());
        }

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Transaction already verified").build());
        }

        // Verifica formato TriboPay
        // Verifica formato TriboPay
        if (body.has("payment_status") && (body.get("payment_status").getAsString().equals("paid")
                || body.get("payment_status").getAsString().equals("approved"))) {

            var acc = accountService.getAccountById(transaction.getAccountId());
            var transactions = transactionService.getAllTransactionsByAccountId(acc.getId());

            if (acc.getReferralCode() != null) {
                if (!acc.getReferralCode().isEmpty()) {
                    var aff = accountService.getAccountByAffiliateId(acc.getReferralCode());

                    if (aff != null) {
                        var isFirstDeposit = false;
                        for (var tx : transactions) {
                            if (tx.getType().equals(TransactionType.CREDIT)
                                    && tx.getStatus().equals(TransactionStatus.APPROVED)) {
                                isFirstDeposit = false;
                                break;
                            } else {
                                isFirstDeposit = true;
                            }
                        }

                        if (isFirstDeposit) {
                            aff.getWallet()
                                    .setAffiliate(aff.getWallet().getAffiliate() + aff.getAffiliate().getCpa());

                            var afflog = AffiliateLog.builder().id(UUID.randomUUID().toString())
                                    .affiliateId(aff.getId())
                                    .operationId(transactionId)
                                    .userId(acc.getId()).userName(acc.getFirstName() + " " + acc.getLastName())
                                    .affiliateType(AffiliateType.DEPOSIT)
                                    .revenueType(AffiliateRevenueType.CPA).amountBase(aff.getAffiliate().getCpa())
                                    .totalWin(aff.getAffiliate().getCpa()).createdAt(System.currentTimeMillis())
                                    .build();

                            affiliateService.create(afflog);

                            accController.publish(aff.getId(), aff);
                            accountService.save(aff);
                        } else {
                            var percent = aff.getAffiliate().getPercentPerDeposit();
                            var value = (transaction.getAmount() / 100) * percent;
                            aff.getWallet().setAffiliate(aff.getWallet().getAffiliate() + (value));

                            var afflog = AffiliateLog.builder().id(UUID.randomUUID().toString())
                                    .affiliateId(aff.getId())
                                    .operationId(transactionId)
                                    .userId(acc.getId()).userName(acc.getFirstName() + " " + acc.getLastName())
                                    .affiliateType(AffiliateType.DEPOSIT)
                                    .revenueType(AffiliateRevenueType.PERCENT).amountBase(value).totalWin(value)
                                    .createdAt(System.currentTimeMillis()).build();

                            affiliateService.create(afflog);

                            accController.publish(aff.getId(), aff);
                            accountService.save(aff);
                        }
                    }
                }
            }

            transaction.setStatus(TransactionStatus.APPROVED);
            acc.getWallet().setBalance(acc.getWallet().getBalance() + (transaction.getAmount()));
            acc.getWallet().setBonus(transaction.getBonus());

            accController.publish(acc.getId(), acc);
            accountService.save(acc);
            transactionService.save(transaction);
        }

        return App.getGson()
                .toJson(ResponseModal.builder().status(true).message("Transaction successfully approved").build());

    }

    @PostMapping("/withdraw")
    public String withdraw(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String requestBody)
            throws IOException {
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        if (!body.has("amount")) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Amount is required").build());
        }

        var config = systemService.getSystem();

        double amount = body.get("amount").getAsDouble();
        var wallet = body.get("wallet").getAsString();

        if (amount <= 0) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Amount must be greater than zero").build());
        }

        if (amount < config.getTransaction().getMinWithdraw()) {
            return App.getGson().toJson(ResponseModal.builder().status(false)
                    .message("O saque mínimo é de " + config.getTransaction().getMinWithdraw() + " reais.").build());
        }

        if (account.getPersonalInfo().getCpf().isEmpty()) {
            return App.getGson().toJson(
                    ResponseModal.builder().status(false).message("CPF is required to make a withdraw").build());
        }

        if (account.getWallet().getBalance() < amount) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Insufficient balance").build());
        }

        var response = transactionService.createTransaction(account, amount);

        if (wallet.equals("balance")) {
            account.getWallet().setBalance(account.getWallet().getBalance() - amount);
        } else if (wallet.equals("affiliate")) {
            account.getWallet().setAffiliate(account.getWallet().getAffiliate() + amount);
        }

        accController.publish(account.getId(), account);
        accountService.save(account);

        return App.getGson().toJson(response);
    }

    public static boolean checkCpf(String cpf) {
        String numericCPF = cpf.replaceAll("\\D", "");

        if (numericCPF.length() != 11 || numericCPF.matches("(\\d)\\1{10}")) {
            return false;
        }

        int firstCheckDigit = calculateCheckDigit(numericCPF, 10);
        int secondCheckDigit = calculateCheckDigit(numericCPF, 11);

        return numericCPF.charAt(9) == Character.forDigit(firstCheckDigit, 10)
                && numericCPF.charAt(10) == Character.forDigit(secondCheckDigit, 10);
    }

    private static int calculateCheckDigit(String cpf, int factor) {
        int sum = 0;

        for (int i = 0; i < factor - 1; i++) {
            sum += Character.getNumericValue(cpf.charAt(i)) * (factor - i);
        }

        int result = 11 - (sum % 11);
        return result >= 10 ? 0 : result;
    }

}
