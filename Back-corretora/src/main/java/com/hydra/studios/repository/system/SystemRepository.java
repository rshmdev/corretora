package com.hydra.studios.repository.system;

import com.hydra.studios.model.system.SystemConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemRepository extends MongoRepository<SystemConfig, String> {

}
