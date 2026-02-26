package com.hydra.studios.controller.admin;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.component.gateway.VeoPayGateway;
import com.hydra.studios.controller.response.ResponseModal;
import com.hydra.studios.model.account.role.AccountRole;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.system.SystemService;
import com.hydra.studios.service.transaction.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/admin")
public class AdminController {

    @Autowired
    private SystemService systemService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private VeoPayGateway veoPayGateway;

    @GetMapping("/info")
    public String info() {
        var system = systemService.getSystem();

        var obj = new JsonObject();

        obj.addProperty("name", system.getName());
        obj.addProperty("description", system.getDescription());
        obj.addProperty("logo", system.getLogo());
        obj.addProperty("favicon", system.getFavicon());
        obj.addProperty("minDeposit", system.getTransaction().getMinDeposit());
        obj.addProperty("minWithdrawal", system.getTransaction().getMinWithdraw());

        return App.getGson().toJson(ResponseModal.builder().status(true).data(obj).build());
    }

    @GetMapping("/summary")
    public String summary(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var summary = systemService.getSummary();

        return App.getGson().toJson(ResponseModal.builder().status(true).data(summary).build());
    }

    @GetMapping("/transactions")
    public String transactions(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var transactions = systemService.getTransactions();

        return App.getGson().toJson(ResponseModal.builder().status(true).data(transactions).build());
    }

    @GetMapping("/accounts")
    public String accounts(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var accounts = systemService.getAccounts();

        return App.getGson().toJson(ResponseModal.builder().status(true).data(accounts).build());
    }

    @GetMapping("/accounts/{id}")
    public String accountDetail(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String id) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var acc = accountService.getAccountById(id);
        if (acc == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var rs = systemService.getAccountDetail(id);

        return App.getGson().toJson(ResponseModal.builder().status(true).data(rs).build());
    }

    @GetMapping("/settings")
    public String settings(@AuthenticationPrincipal UserDetails userDetails) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var settings = systemService.getSystem();

        return App.getGson().toJson(ResponseModal.builder().status(true).data(settings).build());
    }

    @PostMapping("/transactions/withdrawal/{id}")
    public String processWithdrawal(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String id,
            @RequestBody String requestBody) {
        var account = accountService.getAccount(userDetails.getUsername());
        var body = JsonParser.parseString(requestBody).getAsJsonObject();

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var transaction = systemService.getTransactionById(id);
        var action = body.get("action").getAsString();

        if (transaction == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Transaction not found").build());
        }
        if (transaction.getType() != TransactionType.DEBIT) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Transaction is not a withdrawal").build());
        }
        if (!transaction.getStatus().equals(TransactionStatus.PENDING)) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Transaction already processed").build());
        }

        if (action.equals("approve")) {
            String pixKey = body.has("pixKey") ? body.get("pixKey").getAsString() : "";
            String keyType = body.has("keyType") ? body.get("keyType").getAsString() : "CPF";

            if (pixKey.isEmpty()) {
                return App.getGson().toJson(ResponseModal.builder().status(false)
                        .message("pixKey é obrigatória para aprovar o saque").build());
            }

            var res = veoPayGateway.createWithdrawal(transaction, pixKey, keyType);
            if (!res.get("status").getAsBoolean()) {
                return App.getGson().toJson(
                        ResponseModal.builder().status(false).message(res.get("message").getAsString()).build());
            }

            transaction.setStatus(TransactionStatus.APPROVED);
            transaction.setUpdateAt(System.currentTimeMillis());
            systemService.saveTransaction(transaction);
        } else {
            var acc = accountService.getAccountById(transaction.getAccountId());
            acc.getWallet().setBalance(acc.getWallet().getBalance() + transaction.getAmount());

            transaction.setStatus(TransactionStatus.REJECTED);
            transaction.setUpdateAt(System.currentTimeMillis());
            systemService.saveTransaction(transaction);
            accountService.save(acc);
        }

        return App.getGson().toJson(
                ResponseModal.builder().status(true).message("Transaction processed").data(transaction).build());
    }

    @PostMapping("/settings/edit")
    public String editSettings(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String requestBody) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var body = JsonParser.parseString(requestBody).getAsJsonObject();
        var system = systemService.getSystem();

        systemService.edit(system, body);

        return App.getGson()
                .toJson(ResponseModal.builder().status(true).message("Settings Edited").data(system).build());
    }

    @PostMapping("/accounts/edit/{id}")
    public String editAccount(@AuthenticationPrincipal UserDetails userDetails, @RequestBody String requestBody,
            @PathVariable String id) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var body = JsonParser.parseString(requestBody).getAsJsonObject();
        var acc = accountService.getAccountById(id);

        accountService.edit(acc, body);

        var rs = JsonParser.parseString(App.getGson().toJson(acc)).getAsJsonObject();

        rs.remove("password");

        return App.getGson().toJson(ResponseModal.builder().status(true).message("Account Edited").data(rs).build());
    }

    @DeleteMapping("/accounts/delete/{id}")
    public String deleteAccount(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String id) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }
        if (account.getRole() != AccountRole.ADMIN) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Access denied").build());
        }

        var acc = accountService.getAccountById(id);
        if (acc == null) {
            return App.getGson()
                    .toJson(ResponseModal.builder().status(false).message("Account to delete not found").build());
        }

        accountService.delete(acc);

        return App.getGson().toJson(ResponseModal.builder().status(true).message("Account Deleted").build());
    }

}
