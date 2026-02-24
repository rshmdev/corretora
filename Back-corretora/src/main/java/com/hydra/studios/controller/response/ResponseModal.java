package com.hydra.studios.controller.response;

import lombok.*;

@Builder
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResponseModal {

    private boolean status;
    private String message;
    private Object data;
}
