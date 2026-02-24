package com.hydra.studios.service.bet;

import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.model.account.Account;
import com.hydra.studios.model.activity.ActivityLog;
import com.hydra.studios.model.activity.type.ActivityLogType;
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

import static com.hydra.studios.model.activity.type.ActivityLogType.TRADE_CREATE;

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

    public Bet createBet(Account account, String pair, double amount, String interval, BetArrow betArrow, boolean demo) {
        var starredKline = binanceKlineService.getKlines().stream().filter(k -> k.getPair().equals(pair)).reduce((first, last) -> last).orElse(null);

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
                .finishIn(System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(Integer.parseInt(interval.replace("m", "")))).build();

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

        activityService.createActivityLog(account.getId(), "TRADE_CREATE", "{\"pair\":\""+pair+"\",\"amount\":"+amount+",\"interval\":\""+interval+"\",\"arrow\":\""+betArrow+"\",\"demo\":"+demo+"}");

        accController.publish(account.getId(), account);
        accountService.save(account);
        return betRepository.save(bet);
    }

    public Bet closeBet(Bet bet, double closingPrice) {
        if (bet.getStatus() != null) {
            return null;
        }

        var config = systemService.getSystem();

        bet.setFinishedPrice(closingPrice);

        var account = accountService.getAccountById(bet.getAccountId());

        var upOrDown = closingPrice > bet.getStarredPrice() ? BetArrow.UP : closingPrice < bet.getStarredPrice() ? BetArrow.DOWN : null;

        if (upOrDown == null) {
            bet.setStatus(BetStatus.LOSE);
        }

        if (upOrDown == BetArrow.UP && bet.getArrow() == BetArrow.UP) {
            bet.setStatus(BetStatus.WIN);
            bet.setResult(bet.getBet() + (bet.getBet() * ((double) config.getWinPercent() / 100)));
        } else if (upOrDown == BetArrow.DOWN && bet.getArrow() == BetArrow.DOWN) {
            bet.setStatus(BetStatus.WIN);
            bet.setResult(bet.getBet() + (bet.getBet() * ((double) config.getWinPercent() / 100)));
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
                if (aff != null) {
                    var revenue = bet.getBet() * ((double) aff.getAffiliate().getRevenueShare() / 100);
                    aff.getWallet().setAffiliate(aff.getWallet().getAffiliate() + revenue);

                    var affLog = AffiliateLog.builder().id(UUID.randomUUID().toString()).affiliateId(aff.getId()).userId(account.getId()).userName(account.getFirstName() + " " + account.getLastName())
                            .affiliateType(AffiliateType.LOSS).revenueType(AffiliateRevenueType.REVSHARE).amountBase(bet.getBet()).totalWin(revenue).operationId(bet.getId()).createdAt(System.currentTimeMillis()).build();

                    affiliateService.create(affLog);

                    if (aff.getReferralCode() != null && !aff.getReferralCode().isEmpty()) {
                        var superAff = accountService.getAccountByAffiliateId(aff.getReferralCode());
                        if (superAff != null) {
                            var superRevenue = revenue * ((double) 8 / 100);
                            superAff.getWallet().setAffiliate(superAff.getWallet().getAffiliate() + superRevenue);

                            var superAffLog = AffiliateLog.builder().id(UUID.randomUUID().toString()).affiliateId(superAff.getId()).userId(account.getId()).userName(account.getFirstName() + " " + account.getLastName())
                                    .affiliateType(AffiliateType.LOSS).revenueType(AffiliateRevenueType.SUB_AFFILIATE).amountBase(bet.getBet()).totalWin(superRevenue).operationId(bet.getId()).createdAt(System.currentTimeMillis()).build();

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
                if (aff != null) {
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

        accController.publishBet(account.getId(), App.getGson().toJson(bet));

        activityService.createActivityLog(account.getId(), "TRADE_CLOSE", "{\"pair\":\""+bet.getPair()+"\",\"amount\":"+bet.getBet()+",\"interval\":\""+bet.getInterval()+"\",\"arrow\":\""+bet.getArrow()+"\",\"demo\":"+bet.isDemo()+",\"status\":\""+bet.getStatus()+"\",\"result\":"+bet.getResult()+",\"starredPrice\":"+bet.getStarredPrice()+",\"finishedPrice\":"+bet.getFinishedPrice()+"}");

        return betRepository.save(bet);
    }

    public List<Bet> getBetsByAccountIdAndNotFinished(String accountId) {
        return betRepository.findAllByAccountIdAndFinished(accountId, false);
    }
    public List<Bet> getBetsByAccountId(String accountId) {
        return betRepository.findALlByAccountId(accountId);
    }
    public List<Bet> getBetsByFinishIn(long timestamp, double finishedPrice) {
        return betRepository.findAllByFinishInBeforeAndFinishedPrice(timestamp, finishedPrice);
    }
}
