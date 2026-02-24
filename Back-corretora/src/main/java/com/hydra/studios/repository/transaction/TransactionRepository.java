package com.hydra.studios.repository.transaction;

import com.hydra.studios.model.transaction.Transaction;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    List<Transaction> findAllByStatus(TransactionStatus status);
    List<Transaction> findAllByTypeAndStatus(TransactionType type, TransactionStatus status);

    List<Transaction> findAllByAccountId(String accountId);
}
