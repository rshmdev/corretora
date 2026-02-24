package com.hydra.studios.service.activity;

import com.google.gson.JsonObject;
import com.hydra.studios.model.activity.ActivityLog;
import com.hydra.studios.model.activity.type.ActivityLogType;
import com.hydra.studios.repository.activity.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    public ActivityLog createActivityLog(String accountId, String type, String body) {
        var activityLog = ActivityLog.builder()
                .accountId(accountId)
                .type(ActivityLogType.fromString(type))
                .body(body)
                .occurredAt(System.currentTimeMillis())
                .build();

        return activityRepository.save(activityLog);
    }

    public ActivityLog getActivityLog(String activityId) {
        return activityRepository.findById(activityId).orElse(null);
    }

    public List<ActivityLog> getAllActivitiesByAccount(String accountId) {
        return activityRepository.findAllByAccountId(accountId);
    }
}
