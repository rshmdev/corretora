package com.hydra.studios.repository.bet;

import com.hydra.studios.model.bet.Bet;
import com.hydra.studios.model.bet.status.BetStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface BetRepository extends MongoRepository<Bet, String> {

    List<Bet> findALlByAccountId(String accountId);
    List<Bet> findALlByAccountIdAndDemo(String accountId, boolean demo);
    List<Bet> findAllByFinishInBeforeAndFinishedPrice(long finishInBefore, double finishedPrice);

    List<Bet> findAllByAccountIdAndFinished(String accountId, boolean finished);

    int countByCreatedAtBefore(long createdAt);

    List<Bet> findBetsByCreatedAtBefore(long createdAt);
}
