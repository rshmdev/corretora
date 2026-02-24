package com.hydra.studios.controller.graphics;

import com.hydra.studios.App;
import com.hydra.studios.controller.response.ResponseModal;
import com.hydra.studios.repository.klines.KlineRepository;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.binance.BinanceKlineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/graphics")
public class GraphicsRepository {

    @Autowired
    private KlineRepository klineRepository;

    @Autowired
    private AccountService accountService;

    @GetMapping("/klines/{pair}/{interval}")
    public String history(@AuthenticationPrincipal UserDetails userDetails, @PathVariable String pair, @PathVariable String interval) {
        var account = accountService.getAccount(userDetails.getUsername());

        if (account == null) {
            return App.getGson().toJson(ResponseModal.builder().status(false).message("Account not found").build());
        }

        var klines = klineRepository.findTop500ByPairAndIntervalOrderByOpenTimeDesc(pair, interval);

        return App.getGson().toJson(ResponseModal.builder().status(true).data(klines).build());
    }
}
