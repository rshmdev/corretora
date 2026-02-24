package com.hydra.studios.ws.interceptor;

import com.hydra.studios.component.jwt.JWTComponent;
import com.hydra.studios.service.account.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

@Component
public class JwtAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JWTComponent jwtComponent;

    @Autowired
    private AccountService accountService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (accessor.getCommand() != null) {
            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String token = accessor.getFirstNativeHeader("Authorization");

                if (token == null || !token.startsWith("Bearer ")) {
                    throw new IllegalArgumentException("Authorization header ausente ou inválido");
                }

                token = token.substring(7);
                String username = jwtComponent.extractUsername(token);

                if (!jwtComponent.validateToken(token, username)) {
                    throw new IllegalArgumentException("Token JWT inválido");
                }

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null, List.of());

                accessor.setUser(auth);
            }
            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                String destination = accessor.getDestination();

                if (destination != null && destination.startsWith("/topic/account/")) {
                    String accountId = destination.replace("/topic/account/", "");

                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token == null || !token.startsWith("Bearer ")) {
                        throw new IllegalArgumentException("Authorization header ausente ou inválido");
                    }

                    token = token.substring(7);
                    String username = jwtComponent.extractUsername(token);

                    var account = accountService.getAccount(username);

                    if (account == null) {
                        throw new IllegalArgumentException("Usuário não encontrado");
                    }

                    if (!account.getId().equals(accountId)) {
                        throw new IllegalArgumentException("Usuário não autorizado para esse canal");
                    }
                }

                if (destination != null && destination.startsWith("/topic/bets/")) {
                    String accountId = destination.replace("/topic/bets/", "");

                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token == null || !token.startsWith("Bearer ")) {
                        throw new IllegalArgumentException("Authorization header ausente ou inválido");
                    }

                    token = token.substring(7);
                    String username = jwtComponent.extractUsername(token);

                    var account = accountService.getAccount(username);

                    if (account == null) {
                        throw new IllegalArgumentException("Usuário não encontrado");
                    }

                    System.out.println("Account ID (route): " + accountId);
                    System.out.println("Account ID (" + account.getId() + ") equals (" + accountId + "): " + account.getId().equals(accountId));

                    if (!account.getId().equals(accountId)) {
                        throw new IllegalArgumentException("Usuário não autorizado para esse canal");
                    }
                }
            }
        }

        return message;
    }

}
