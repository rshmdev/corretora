package com.hydra.studios.component.gateway;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.model.transaction.Transaction;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.system.SystemService;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VeoPayGateway {

    private static final String VEOPAG_BASE_URL = "https://api.veopag.com";

    @Autowired
    private SystemService systemService;

    @Autowired
    private AccountService accountService;

    @Value("${endpoint.api}")
    public String endpoint;

    private final OkHttpClient client = new OkHttpClient();

    // -------------------------------------------------------------------------
    // Authentication
    // -------------------------------------------------------------------------

    public String createToken() {
        var config = systemService.getSystem();

        String clientId = config.getGateway().getClientId();
        String clientSecret = config.getGateway().getClientSecret();

        System.out.println("[VeoPag] Autenticando... clientId=" + clientId);

        if (clientId == null || clientId.isEmpty() || clientSecret == null || clientSecret.isEmpty()) {
            System.out.println("[VeoPag] ERRO - clientId ou clientSecret não configurados.");
            return null;
        }

        var bodyJson = new JsonObject();
        bodyJson.addProperty("client_id", clientId);
        bodyJson.addProperty("client_secret", clientSecret);

        var requestBody = RequestBody.create(
                bodyJson.toString(),
                okhttp3.MediaType.parse("application/json; charset=utf-8"));

        var request = new Request.Builder()
                .url(VEOPAG_BASE_URL + "/api/auth/login")
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .post(requestBody)
                .build();

        try (var response = client.newCall(request).execute()) {
            var responseBody = response.body().string();
            System.out.println("[VeoPag] Auth Response Code: " + response.code());
            System.out.println("[VeoPag] Auth Response Body: " + responseBody);

            if (!response.isSuccessful())
                return null;

            var json = JsonParser.parseString(responseBody).getAsJsonObject();
            if (json.has("token")) {
                return json.get("token").getAsString();
            }
            return null;
        } catch (Exception e) {
            System.out.println("[VeoPag] Auth Exception: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Deposit (PIX IN)
    // -------------------------------------------------------------------------

    public JsonObject createDeposit(Transaction transaction) {
        var object = new JsonObject();
        var config = systemService.getSystem();

        if (transaction.getAmount() < config.getTransaction().getMinDeposit()) {
            object.addProperty("status", false);
            object.addProperty("message", "O valor mínimo para depósito é " + config.getTransaction().getMinDeposit());
            return object;
        }

        var token = createToken();
        if (token == null) {
            object.addProperty("status", false);
            object.addProperty("message", "Falha ao autenticar no gateway VeoPag. Verifique as credenciais.");
            return object;
        }

        var acc = accountService.getAccountById(transaction.getAccountId());
        String callbackUrl = endpoint + "/v1/account/deposit/" + transaction.getId() + "/callback";

        var bodyJson = new JsonObject();
        bodyJson.addProperty("amount", transaction.getAmount());
        bodyJson.addProperty("external_id", transaction.getId());
        bodyJson.addProperty("clientCallbackUrl", callbackUrl);

        var payer = new JsonObject();
        payer.addProperty("name", acc.getFirstName() + " " + acc.getLastName());
        payer.addProperty("email", acc.getEmail());
        String cpf = acc.getPersonalInfo().getCpf() != null
                ? acc.getPersonalInfo().getCpf().replaceAll("\\D", "")
                : "00000000000";
        payer.addProperty("document", cpf);
        bodyJson.add("payer", payer);

        System.out.println("[VeoPag] Criando depósito: " + bodyJson);

        var requestBody = RequestBody.create(
                bodyJson.toString(),
                okhttp3.MediaType.parse("application/json; charset=utf-8"));

        var request = new Request.Builder()
                .url(VEOPAG_BASE_URL + "/api/payments/deposit")
                .addHeader("Authorization", "Bearer " + token)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .post(requestBody)
                .build();

        try (var response = client.newCall(request).execute()) {
            var responseBody = response.body().string();
            System.out.println("[VeoPag] Deposit Response Code: " + response.code());
            System.out.println("[VeoPag] Deposit Response Body: " + responseBody);

            var json = JsonParser.parseString(responseBody).getAsJsonObject();

            if (!response.isSuccessful()) {
                object.addProperty("status", false);
                String msg = json.has("message") ? json.get("message").getAsString() : "Erro desconhecido";
                object.addProperty("message", "Erro VeoPag: " + msg);
                return object;
            }

            // Extrai transactionId e qrcode do response
            if (json.has("qrCodeResponse")) {
                var qrResp = json.getAsJsonObject("qrCodeResponse");
                if (qrResp.has("qrcode")) {
                    transaction.setQrcode(qrResp.get("qrcode").getAsString());
                }
                if (qrResp.has("transactionId")) {
                    transaction.setReference(qrResp.get("transactionId").getAsString());
                }
            }

            object.addProperty("status", true);
            object.addProperty("message", "Depósito criado com sucesso");
            object.add("data", JsonParser.parseString(App.getGson().toJson(transaction)).getAsJsonObject());
            return object;

        } catch (Exception e) {
            System.out.println("[VeoPag] Deposit Exception: " + e.getMessage());
            e.printStackTrace();
            object.addProperty("status", false);
            object.addProperty("message", "Erro interno ao criar depósito: " + e.getMessage());
            return object;
        }
    }

    // -------------------------------------------------------------------------
    // Withdrawal (PIX OUT)
    // -------------------------------------------------------------------------

    public JsonObject createWithdrawal(Transaction transaction, String pixKey, String keyType) {
        var object = new JsonObject();
        var config = systemService.getSystem();

        if (transaction.getAmount() < config.getTransaction().getMinWithdraw()) {
            object.addProperty("status", false);
            object.addProperty("message", "O valor mínimo para saque é " + config.getTransaction().getMinWithdraw());
            return object;
        }

        var token = createToken();
        if (token == null) {
            object.addProperty("status", false);
            object.addProperty("message", "Falha ao autenticar no gateway VeoPag. Verifique as credenciais.");
            return object;
        }

        var acc = accountService.getAccountById(transaction.getAccountId());
        String callbackUrl = endpoint + "/v1/account/withdraw/" + transaction.getId() + "/callback";

        String cpf = acc.getPersonalInfo().getCpf() != null
                ? acc.getPersonalInfo().getCpf().replaceAll("\\D", "")
                : "00000000000";

        var bodyJson = new JsonObject();
        bodyJson.addProperty("amount", transaction.getAmount());
        bodyJson.addProperty("external_id", transaction.getId());
        bodyJson.addProperty("pix_key", pixKey);
        bodyJson.addProperty("key_type", keyType);
        bodyJson.addProperty("name", acc.getFirstName() + " " + acc.getLastName());
        bodyJson.addProperty("taxId", cpf);
        bodyJson.addProperty("description", "Saque via plataforma");
        bodyJson.addProperty("clientCallbackUrl", callbackUrl);

        System.out.println("[VeoPag] Criando saque: " + bodyJson);

        var requestBody = RequestBody.create(
                bodyJson.toString(),
                okhttp3.MediaType.parse("application/json; charset=utf-8"));

        var request = new Request.Builder()
                .url(VEOPAG_BASE_URL + "/api/withdrawals/withdraw")
                .addHeader("Authorization", "Bearer " + token)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .post(requestBody)
                .build();

        try (var response = client.newCall(request).execute()) {
            var responseBody = response.body().string();
            System.out.println("[VeoPag] Withdraw Response Code: " + response.code());
            System.out.println("[VeoPag] Withdraw Response Body: " + responseBody);

            var json = JsonParser.parseString(responseBody).getAsJsonObject();

            if (!response.isSuccessful()) {
                object.addProperty("status", false);
                String msg = json.has("message") ? json.get("message").getAsString() : "Erro desconhecido";
                object.addProperty("message", "Erro VeoPag: " + msg);
                return object;
            }

            if (json.has("withdrawal") && json.getAsJsonObject("withdrawal").has("transaction_id")) {
                transaction.setReference(json.getAsJsonObject("withdrawal").get("transaction_id").getAsString());
            }

            object.addProperty("status", true);
            object.addProperty("message", "Saque processado com sucesso");
            object.add("data", JsonParser.parseString(App.getGson().toJson(transaction)).getAsJsonObject());
            return object;

        } catch (Exception e) {
            System.out.println("[VeoPag] Withdraw Exception: " + e.getMessage());
            e.printStackTrace();
            object.addProperty("status", false);
            object.addProperty("message", "Erro interno ao criar saque: " + e.getMessage());
            return object;
        }
    }
}
