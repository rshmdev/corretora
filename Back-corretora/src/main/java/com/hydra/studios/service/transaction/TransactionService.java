package com.hydra.studios.service.transaction;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.component.gateway.VeoPayGateway;
import com.hydra.studios.model.account.Account;
import com.hydra.studios.model.transaction.Transaction;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import com.hydra.studios.repository.transaction.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private VeoPayGateway veoPayGateway;

    public JsonObject createTransaction(Account account, double amount, double bonus) {
        var transaction = Transaction.builder()
                .id(UUID.randomUUID().toString())
                .accountId(account.getId())
                .reference("")
                .type(TransactionType.CREDIT)
                .qrcode("")
                .amount(amount)
                .bonus(bonus)
                .status(TransactionStatus.PENDING)
                .createAt(System.currentTimeMillis())
                .updateAt(System.currentTimeMillis())
                .build();

        transactionRepository.save(transaction);

        JsonObject obj = veoPayGateway.createDeposit(transaction);

        if (obj.has("status") && obj.get("status").getAsBoolean()) {
            // Salva novamente com qrcode e reference preenchidos pelo gateway
            transactionRepository.save(transaction);
        }

        return obj;
    }

    public JsonObject createTransaction(Account account, double amount) throws IOException {
        var transaction = Transaction.builder()
                .id(UUID.randomUUID().toString())
                .accountId(account.getId())
                .reference("")
                .type(TransactionType.DEBIT)
                .qrcode("")
                .amount(amount)
                .bonus(0)
                .status(TransactionStatus.PENDING)
                .createAt(System.currentTimeMillis())
                .updateAt(System.currentTimeMillis())
                .build();

        transactionRepository.save(transaction);

        return JsonParser.parseString(App.getGson().toJson(transaction)).getAsJsonObject();
    }

    public Transaction getTransactionById(String id) {
        return transactionRepository.findById(id).orElse(null);
    }

    public List<Transaction> getAllTransactionsByAccountId(String accountId) {
        return transactionRepository.findAllByAccountId(accountId);
    }

    public void save(Transaction transaction) {
        transactionRepository.save(transaction);
    }
}
