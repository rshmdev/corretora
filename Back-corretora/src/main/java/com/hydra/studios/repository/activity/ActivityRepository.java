package com.hydra.studios.repository.activity;

import com.hydra.studios.model.activity.ActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends MongoRepository<ActivityLog, String> {

    List<ActivityLog> findAllByAccountId(String accountId);
}
