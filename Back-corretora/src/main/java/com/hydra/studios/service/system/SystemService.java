package com.hydra.studios.service.system;

import com.google.gson.JsonObject;
import com.hydra.studios.App;
import com.hydra.studios.component.gateway.BsPayGateway;
import com.hydra.studios.model.system.SystemConfig;
import com.hydra.studios.model.system.gateway.GatewayConfig;
import com.hydra.studios.model.system.transaction.TransactionConfig;
import com.hydra.studios.model.transaction.Transaction;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import com.hydra.studios.repository.account.AccountRepository;
import com.hydra.studios.repository.bet.BetRepository;
import com.hydra.studios.repository.system.SystemRepository;
import com.hydra.studios.repository.transaction.TransactionRepository;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.activity.ActivityService;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

import static com.hydra.studios.model.affiliate.type.AffiliateType.DEPOSIT;

@Service
public class SystemService {

    @Autowired
    private SystemRepository systemRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private BetRepository betRepository;

    @Autowired
    private ActivityService activityService;
    @Autowired
    private AccountService accountService;

    public SystemConfig getSystem() {
        var system = systemRepository.findById("1").orElse(null);

        if (system == null) {
            system = SystemConfig.builder()
                    .id("1")
                    .name("Hydra Studios")
                    .description("Default system configuration")
                    .logo("https://example.com/logo.png")
                    .favicon("https://example.com/favicon.ico")
                    .transaction(new TransactionConfig())
                    .gateway(new GatewayConfig())
                    .winPercent(80)
                    .build();
            systemRepository.save(system);
        }
        if (system.getWinPercent() <= 0) {
            system.setWinPercent(80);
            systemRepository.save(system);
        }

        return system;
    }

    public JsonObject getSummary() {
        var json = new JsonObject();

        var transactions = transactionRepository.findAllByStatus(TransactionStatus.APPROVED);

        var joined = transactions.stream().filter(t -> t.getType().equals(TransactionType.CREDIT))
                .mapToDouble(Transaction::getAmount).sum();
        var left = transactions.stream().filter(t -> t.getType().equals(TransactionType.DEBIT))
                .mapToDouble(Transaction::getAmount).sum();

        var lastAccounts24h = accountRepository
                .countByFirstLoginBefore(System.currentTimeMillis() + TimeUnit.DAYS.toMillis(1));

        var bets24h = betRepository.findBetsByCreatedAtBefore(System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1));
        var operationsRecent = bets24h.size();

        var lastFive = bets24h.stream().sorted((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt())).limit(5)
                .toList();
        var lastFiveJson = App.getGson().toJsonTree(lastFive).getAsJsonArray();

        for (var bet : lastFiveJson) {
            var acc = accountRepository.findById(bet.getAsJsonObject().get("accountId").getAsString()).orElse(null);
            if (acc != null) {
                bet.getAsJsonObject().addProperty("user", acc.getFirstName() + " " + acc.getLastName());
            }
        }

        json.addProperty("joined", joined);
        json.addProperty("left", left);

        json.addProperty("balance", joined - left);

        json.addProperty("accounts", accountRepository.count());
        json.addProperty("accountsLast24h", lastAccounts24h);

        json.addProperty("transactions", transactionRepository.count());
        json.addProperty("operations_recents", operationsRecent);

        json.add("last_five_operations", lastFiveJson);

        return json;
    }

    public JsonObject getTransactions() {
        var json = new JsonObject();

        var transactions = transactionRepository.findAllByStatus(TransactionStatus.APPROVED);

        var joined = transactions.stream().filter(t -> t.getType().equals(TransactionType.CREDIT)).toList();
        var left = transactions.stream().filter(t -> t.getType().equals(TransactionType.DEBIT)).toList();

        var transactionsPending = transactionRepository.findAllByStatus(TransactionStatus.PENDING);
        var transactionsRejected = transactionRepository.findAllByStatus(TransactionStatus.REJECTED);

        var joinedJson = App.getGson().toJsonTree(joined).getAsJsonArray();
        var leftJson = App.getGson().toJsonTree(left).getAsJsonArray();
        var pendingJson = App.getGson().toJsonTree(transactionsPending).getAsJsonArray();
        var rejectedJson = App.getGson().toJsonTree(transactionsRejected).getAsJsonArray();

        for (var transaction : joinedJson) {
            var acc = accountRepository.findById(transaction.getAsJsonObject().get("accountId").getAsString())
                    .orElse(null);
            if (acc != null) {
                transaction.getAsJsonObject().addProperty("user", acc.getFirstName() + " " + acc.getLastName());
            }
        }

        for (var transaction : leftJson) {
            var acc = accountRepository.findById(transaction.getAsJsonObject().get("accountId").getAsString())
                    .orElse(null);
            if (acc != null) {
                transaction.getAsJsonObject().addProperty("user", acc.getFirstName() + " " + acc.getLastName());
            }
        }

        for (var transaction : pendingJson) {
            var acc = accountRepository.findById(transaction.getAsJsonObject().get("accountId").getAsString())
                    .orElse(null);
            if (acc != null) {
                transaction.getAsJsonObject().addProperty("user", acc.getFirstName() + " " + acc.getLastName());
            }
        }

        for (var transaction : rejectedJson) {
            var acc = accountRepository.findById(transaction.getAsJsonObject().get("accountId").getAsString())
                    .orElse(null);
            if (acc != null) {
                transaction.getAsJsonObject().addProperty("user", acc.getFirstName() + " " + acc.getLastName());
            }
        }

        json.addProperty("joined", joined.stream().mapToDouble(Transaction::getAmount).sum());
        json.addProperty("joined_last_24h",
                joined.stream().filter(t -> t.getCreateAt() >= System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1))
                        .mapToDouble(Transaction::getAmount).sum());

        json.addProperty("left", left.stream().mapToDouble(Transaction::getAmount).sum());
        json.addProperty("left_last_24h",
                left.stream().filter(t -> t.getCreateAt() >= System.currentTimeMillis() - TimeUnit.DAYS.toMillis(1))
                        .mapToDouble(Transaction::getAmount).sum());

        json.addProperty("pending_transactions", transactionsPending.size());

        json.add("joined_transactions", joinedJson);
        json.add("pending_transactions", pendingJson);
        json.add("left_transactions", leftJson);
        json.add("rejected_transactions", rejectedJson);

        return json;
    }

    public JsonObject getAccounts() {
        var json = new JsonObject();

        var accounts = accountRepository.findAll();

        json.addProperty("total", accounts.size());

        var accountsJson = App.getGson().toJsonTree(accounts).getAsJsonArray();

        for (var account : accountsJson) {
            account.getAsJsonObject().remove("password");
        }

        json.add("accounts", accountsJson);

        return json;
    }

    public JsonObject edit(SystemConfig system, JsonObject body) {
        if (body.has("name")) {
            system.setName(body.get("name").getAsString());
        }
        if (body.has("description")) {
            system.setDescription(body.get("description").getAsString());
        }
        if (body.has("logo")) {
            system.setLogo(body.get("logo").getAsString());
        }
        if (body.has("favicon")) {
            system.setFavicon(body.get("favicon").getAsString());
        }
        if (body.has("transaction")) {
            var transaction = body.getAsJsonObject("transaction");
            if (transaction.has("minDeposit")) {
                system.getTransaction().setMinDeposit(transaction.get("minDeposit").getAsDouble());
            }
            if (transaction.has("minWithdraw")) {
                system.getTransaction().setMinWithdraw(transaction.get("minWithdraw").getAsDouble());
            }
        }
        if (body.has("gateway")) {
            var gateway = body.getAsJsonObject("gateway");
            if (gateway.has("apitoken")) {
                system.getGateway().setApiToken(gateway.get("apitoken").getAsString());
            }
            if (gateway.has("clientId")) {
                system.getGateway().setClientId(gateway.get("clientId").getAsString());
            }
            if (gateway.has("clientSecret")) {
                system.getGateway().setClientSecret(gateway.get("clientSecret").getAsString());
            }
        }
        if (body.has("winPercent")) {
            system.setWinPercent(body.get("winPercent").getAsInt());
        }

        systemRepository.save(system);

        return body;
    }

    public Transaction getTransactionById(String id) {
        return transactionRepository.findById(id).orElse(null);
    }

    public JsonObject getAccountDetail(String accountId) {
        var json = new JsonObject();

        var account = accountRepository.findById(accountId).orElse(null);
        if (account == null) {
            return null;
        }

        var transactions = transactionRepository.findAllByAccountId(accountId);
        var bets = betRepository.findALlByAccountIdAndDemo(accountId, false);

        json.add("account", App.getGson().toJsonTree(account));

        var transactionsJson = App.getGson().toJsonTree(transactions).getAsJsonArray();
        for (var transaction : transactionsJson) {
            transaction.getAsJsonObject().remove("accountId");
        }
        json.add("transactions", transactionsJson);

        var betsJson = App.getGson().toJsonTree(bets).getAsJsonArray();
        for (var bet : betsJson) {
            bet.getAsJsonObject().remove("accountId");
        }
        json.add("bets", betsJson);

        var affiliate = accountService.getAllAccountsByReferralCode(account.getAffiliate().getAffiliateId());

        var affiliateJson = App.getGson().toJsonTree(affiliate).getAsJsonArray();

        for (var aff : affiliateJson) {
            var t = transactionRepository.findAllByAccountId(aff.getAsJsonObject().get("id").getAsString());

            var deposits = t.stream().filter(tr -> tr.getType().equals(TransactionType.CREDIT))
                    .filter(tr -> tr.getStatus().equals(TransactionStatus.APPROVED)).mapToDouble(Transaction::getAmount)
                    .sum();

            aff.getAsJsonObject().addProperty("sumDeposit", deposits);

            aff.getAsJsonObject().remove("password");
        }

        json.add("affiliates", affiliateJson);

        var activities = activityService.getAllActivitiesByAccount(accountId);

        var activitiesJson = App.getGson().toJsonTree(activities).getAsJsonArray();

        for (var activity : activitiesJson) {
            activity.getAsJsonObject().remove("accountId");
        }

        json.add("activities", activitiesJson);

        return json;
    }

    public void save(SystemConfig system) {
        systemRepository.save(system);
    }

    public void saveTransaction(Transaction transaction) {
        transactionRepository.save(transaction);
    }
}
