package com.hydra.studios.model.activity;

import com.google.gson.JsonObject;
import com.hydra.studios.model.activity.type.ActivityLogType;
import lombok.*;
import org.springframework.data.annotation.Id;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    private String id;
    private String accountId;

    private ActivityLogType type;

    private String body;

    private long occurredAt;

}
