package com.hydra.studios.model.transaction;

import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.model.transaction.type.TransactionType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;
    private String accountId;
    private String reference;

    private TransactionType type;

    private String qrcode;

    private double amount;
    private double bonus;

    private TransactionStatus status;

    private long createAt;
    private long updateAt;

}
