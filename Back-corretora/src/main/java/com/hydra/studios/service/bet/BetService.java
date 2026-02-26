package com.hydra.studios.service.bet;

import com.hydra.studios.model.account.Account;
import com.hydra.studios.model.affiliate.AffiliateLog;
import com.hydra.studios.model.affiliate.revenue.AffiliateRevenueType;
import com.hydra.studios.model.affiliate.type.AffiliateType;
import com.hydra.studios.model.bet.Bet;
import com.hydra.studios.model.bet.arrow.BetArrow;
import com.hydra.studios.model.bet.status.BetStatus;
import com.hydra.studios.repository.bet.BetRepository;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.activity.ActivityService;
import com.hydra.studios.service.affiliate.AffiliateService;
import com.hydra.studios.service.binance.BinanceKlineService;
import com.hydra.studios.service.system.SystemService;
import com.hydra.studios.ws.controller.AccController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class BetService {

    @Autowired
    private BetRepository betRepository;

    @Autowired
    private BinanceKlineService binanceKlineService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccController accController;

    @Autowired
    private SystemService systemService;

    @Autowired
    private AffiliateService affiliateService;

    @Autowired
    private ActivityService activityService;

    public Bet createBet(Account account, String pair, double amount, String interval, BetArrow betArrow,
            boolean demo) {
        var starredKline = binanceKlineService.getKlines().get(pair);

        if (starredKline == null) {
            return null;
        }

        var bet = Bet.builder()
                .id(UUID.randomUUID().toString())
                .accountId(account.getId())
                .pair(pair)
                .interval(interval)
                .arrow(betArrow)
                .bet(amount)
                .result(0)
                .starredPrice(starredKline.getValue())
                .createdAt(System.currentTimeMillis())
                .demo(demo)
                .finished(false)
                .finishIn(System.currentTimeMillis()
                        + TimeUnit.MINUTES.toMillis(Integer.parseInt(interval.replace("m", ""))))
                .build();

        if (demo) {
            account.getWallet().setDemo(account.getWallet().getDemo() - amount);
        } else {
            var restant = amount;

            var bonusUsed = Math.min(restant, account.getWallet().getBonus());
            account.getWallet().setBonus(account.getWallet().getBonus() - bonusUsed);
            restant -= bonusUsed;

            var depositUsed = Math.min(restant, account.getWallet().getDeposit());
            account.getWallet().setDeposit(account.getWallet().getDeposit() - depositUsed);
            restant -= depositUsed;

            var balanceUsed = Math.min(restant, account.getWallet().getBalance());
            account.getWallet().setBalance(account.getWallet().getBalance() - balanceUsed);
        }

        activityService.createActivityLog(account.getId(), "TRADE_CREATE", "{\"pair\":\"" + pair + "\",\"amount\":"
                + amount + ",\"interval\":\"" + interval + "\",\"arrow\":\"" + betArrow + "\",\"demo\":" + demo + "}");

        accController.publish(account.getId(), account);
        accountService.save(account);
        return betRepository.save(bet);
    }

    public Bet closeBetCashout(String betId) {
        var bet = betRepository.findById(betId).orElse(null);
        if (bet == null || bet.isFinished()) {
            return null;
        }

        var kline = binanceKlineService.getKlines().get(bet.getPair());

        if (kline == null) {
            return null;
        }

        var closingPrice = kline.getValue();
        var upOrDown = closingPrice > bet.getStarredPrice() ? BetArrow.UP
                : closingPrice < bet.getStarredPrice() ? BetArrow.DOWN : null;

        var config = systemService.getSystem();
        double winPercent = config != null ? config.getWinPercent() : 0;
        if (winPercent <= 0) winPercent = 80;

        // Mesmo multiplicador usado no frontend para exibir o P/L (50x amplificação
        // visual)
        final double PNL_DISPLAY_MULTIPLIER = 50.0;

        // P/L real em percentual (ex: 0.08%)
        double realPnlPercent = Math.abs((closingPrice - bet.getStarredPrice()) / bet.getStarredPrice() * 100);
        // P/L amplificado — o que o usuário vê na tela (ex: 4.0%)
        double displayPnlPercent = realPnlPercent * PNL_DISPLAY_MULTIPLIER;

        double payout;

        long totalTime = bet.getFinishIn() - bet.getCreatedAt();
        long remainingTime = bet.getFinishIn() - System.currentTimeMillis();
        double timeProgress = totalTime > 0
                ? Math.min(1.0, Math.max(0.0, 1.0 - ((double) remainingTime / totalTime)))
                : 1.0;

        if (upOrDown == bet.getArrow()) {
            // Ganhando: aproxima do payout final conforme o tempo passa
            // Cap do P/L no winPercent para não ultrapassar o payout final
            double cappedDisplay = Math.min(displayPnlPercent, winPercent);
            double movePayout = bet.getBet() + bet.getBet() * (cappedDisplay / 100.0);
            double fullPayout = bet.getBet() + bet.getBet() * (winPercent / 100.0);
            payout = movePayout + (fullPayout - movePayout) * timeProgress;
            bet.setStatus(BetStatus.WIN);
        } else {
            // Perdendo: desconta a porcentagem exibida da aposta
            // Ex: aposta R$9, mostrando -4% → payout = 9 - 9*0.04 = 8.64
            payout = Math.max(0, bet.getBet() - bet.getBet() * (displayPnlPercent / 100.0));

            // Aplicar penalidade agressiva baseada no tempo restante
            // Se faltar pouco tempo, o valor recuperado cai drasticamente
            // Fator de tempo: varia de 1.0 (início) a 0.0 (fim)
            double timeFactor = totalTime > 0
                    ? Math.min(1.0, Math.max(0, (double) remainingTime / totalTime))
                    : 0.0;

            // Penalidade: quanto mais tempo passou, menos sobra do payout calculado
            // Mantemos um mínimo de 1% do payout apenas para não zerar totalmente antes do
            // fim real
            payout = payout * Math.max(0.01, timeFactor);

            bet.setStatus(BetStatus.LOSE);
        }

        bet.setResult(payout);
        bet.setFinishedPrice(closingPrice);
        bet.setFinished(true);

        var account = accountService.getAccountById(bet.getAccountId());
        if (bet.isDemo()) {
            account.getWallet().setDemo(account.getWallet().getDemo() + payout);
        } else {
            account.getWallet().setBalance(account.getWallet().getBalance() + payout);
        }

        accountService.save(account);
        accController.publish(account.getId(), account);

        // Publica o resultado do bet manualmente (Gson nao serializa campos Lombok no
        // Java 9+)
        var betJson = new com.google.gson.JsonObject();
        betJson.addProperty("id", bet.getId());
        betJson.addProperty("pair", bet.getPair());
        betJson.addProperty("interval", bet.getInterval());
        betJson.addProperty("arrow", bet.getArrow() != null ? bet.getArrow().name() : "");
        betJson.addProperty("bet", bet.getBet());
        betJson.addProperty("result", bet.getResult());
        betJson.addProperty("starredPrice", bet.getStarredPrice());
        betJson.addProperty("finishedPrice", bet.getFinishedPrice());
        betJson.addProperty("status", bet.getStatus() != null ? bet.getStatus().name() : "");
        betJson.addProperty("finished", bet.isFinished());
        betJson.addProperty("profit", payout - bet.getBet()); // Lucro real (payout - investimento)
        accController.publishBet(account.getId(), betJson.toString());

        activityService.createActivityLog(account.getId(), "TRADE_CASHOUT",
                "{\"pair\":\"" + bet.getPair() + "\",\"amount\":" + bet.getBet() + ",\"payout\":" + payout
                        + ",\"status\":\"" + bet.getStatus() + "\"}");

        return betRepository.save(bet);
    }

    public Bet closeBet(Bet bet, double closingPrice) {
        if (bet.getStatus() != null) {
            return null;
        }

        var config = systemService.getSystem();
        double winPercent = config != null ? config.getWinPercent() : 0;
        if (winPercent <= 0) winPercent = 80;

        bet.setFinishedPrice(closingPrice);

        var account = accountService.getAccountById(bet.getAccountId());

        var upOrDown = closingPrice > bet.getStarredPrice() ? BetArrow.UP
                : closingPrice < bet.getStarredPrice() ? BetArrow.DOWN : null;

        if (upOrDown == null) {
            bet.setStatus(BetStatus.LOSE);
        }

        if (upOrDown == BetArrow.UP && bet.getArrow() == BetArrow.UP) {
            bet.setStatus(BetStatus.WIN);
            bet.setResult(bet.getBet() + (bet.getBet() * (winPercent / 100)));
        } else if (upOrDown == BetArrow.DOWN && bet.getArrow() == BetArrow.DOWN) {
            bet.setStatus(BetStatus.WIN);
            bet.setResult(bet.getBet() + (bet.getBet() * (winPercent / 100)));
        } else {
            bet.setStatus(BetStatus.LOSE);
        }

        bet.setFinished(true);

        if (bet.getStatus() == BetStatus.WIN) {
            if (bet.isDemo()) {
                account.getWallet().setDemo(account.getWallet().getDemo() + bet.getResult());
            } else {
                account.getWallet().setBalance(account.getWallet().getBalance() + bet.getResult());
            }
            accController.publish(account.getId(), account);
            accountService.save(account);
        }

        if (bet.getStatus() == BetStatus.LOSE && !bet.isDemo()) {
            if (account.getReferralCode() != null && !account.getReferralCode().isEmpty()) {
                var aff = accountService.getAccountByAffiliateId(account.getReferralCode());
                if (aff != null && aff.getAffiliate() != null && aff.getWallet() != null) {
                    var revenue = bet.getBet() * ((double) aff.getAffiliate().getRevenueShare() / 100);
                    aff.getWallet().setAffiliate(aff.getWallet().getAffiliate() + revenue);

                    var affLog = AffiliateLog.builder().id(UUID.randomUUID().toString()).affiliateId(aff.getId())
                            .userId(account.getId()).userName(account.getFirstName() + " " + account.getLastName())
                            .affiliateType(AffiliateType.LOSS).revenueType(AffiliateRevenueType.REVSHARE)
                            .amountBase(bet.getBet()).totalWin(revenue).operationId(bet.getId())
                            .createdAt(System.currentTimeMillis()).build();

                    affiliateService.create(affLog);

                    if (aff.getReferralCode() != null && !aff.getReferralCode().isEmpty()) {
                        var superAff = accountService.getAccountByAffiliateId(aff.getReferralCode());
                        if (superAff != null) {
                            var superRevenue = revenue * ((double) 8 / 100);
                            superAff.getWallet().setAffiliate(superAff.getWallet().getAffiliate() + superRevenue);

                            var superAffLog = AffiliateLog.builder().id(UUID.randomUUID().toString())
                                    .affiliateId(superAff.getId()).userId(account.getId())
                                    .userName(account.getFirstName() + " " + account.getLastName())
                                    .affiliateType(AffiliateType.LOSS).revenueType(AffiliateRevenueType.SUB_AFFILIATE)
                                    .amountBase(bet.getBet()).totalWin(superRevenue).operationId(bet.getId())
                                    .createdAt(System.currentTimeMillis()).build();

                            affiliateService.create(superAffLog);
                            accController.publish(superAff.getId(), superAff);
                            accountService.save(superAff);
                        }
                    }

                    accController.publish(aff.getId(), aff);
                    accountService.save(aff);
                }
            }
        }
        if (bet.getStatus() == BetStatus.WIN && !bet.isDemo()) {
            if (account.getReferralCode() != null && !account.getReferralCode().isEmpty()) {
                var aff = accountService.getAccountByAffiliateId(account.getReferralCode());
                if (aff != null && aff.getAffiliate() != null && aff.getWallet() != null) {
                    var revenue = bet.getBet();

                    aff.getWallet().setAffiliate(aff.getWallet().getAffiliate() - revenue);

                    var affLog = AffiliateLog.builder()
                            .id(UUID.randomUUID().toString())
                            .affiliateId(aff.getId())
                            .userId(account.getId())
                            .userName(account.getFirstName() + " " + account.getLastName())
                            .affiliateType(AffiliateType.WIN)
                            .revenueType(AffiliateRevenueType.REVSHARE)
                            .amountBase(bet.getBet())
                            .totalWin(-revenue)
                            .operationId(bet.getId())
                            .createdAt(System.currentTimeMillis())
                            .build();

                    affiliateService.create(affLog);
                    accController.publish(aff.getId(), aff);
                    accountService.save(aff);
                }
            }
        }

        // Publica o resultado do bet manualmente (Gson pode falhar em serializar campos
        // Lombok)
        var betResultJson = new com.google.gson.JsonObject();
        betResultJson.addProperty("id", bet.getId());
        betResultJson.addProperty("pair", bet.getPair());
        betResultJson.addProperty("interval", bet.getInterval());
        betResultJson.addProperty("arrow", bet.getArrow() != null ? bet.getArrow().name() : "");
        betResultJson.addProperty("bet", bet.getBet());
        betResultJson.addProperty("result", bet.getResult());
        betResultJson.addProperty("starredPrice", bet.getStarredPrice());
        betResultJson.addProperty("finishedPrice", bet.getFinishedPrice());
        betResultJson.addProperty("status", bet.getStatus() != null ? bet.getStatus().name() : "");
        betResultJson.addProperty("finished", bet.isFinished());
        betResultJson.addProperty("profit", (bet.getResult() != 0 ? bet.getResult() : 0.0) - bet.getBet()); // Lucro
                                                                                                            // real
        accController.publishBet(account.getId(), betResultJson.toString());

        activityService.createActivityLog(account.getId(), "TRADE_CLOSE",
                "{\"pair\":\"" + bet.getPair() + "\",\"amount\":" + bet.getBet() + ",\"interval\":\""
                        + bet.getInterval() + "\",\"arrow\":\"" + bet.getArrow() + "\",\"demo\":" + bet.isDemo()
                        + ",\"status\":\"" + bet.getStatus() + "\",\"result\":" + bet.getResult() + ",\"starredPrice\":"
                        + bet.getStarredPrice() + ",\"finishedPrice\":" + bet.getFinishedPrice() + "}");

        return betRepository.save(bet);
    }

    public List<Bet> getBetsByAccountIdAndNotFinished(String accountId) {
        return betRepository.findAllByAccountIdAndFinished(accountId, false);
    }

    public List<Bet> getBetsByAccountId(String accountId) {
        return betRepository.findALlByAccountId(accountId);
    }

    public List<Bet> getBetsByFinishIn(long timestamp) {
        return betRepository.findAllByFinishInBeforeAndFinished(timestamp, false);
    }
}
