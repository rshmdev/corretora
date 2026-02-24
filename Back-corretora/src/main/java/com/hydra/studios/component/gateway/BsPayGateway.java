package com.hydra.studios.component.gateway;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.hydra.studios.App;
import com.hydra.studios.model.transaction.Transaction;
import com.hydra.studios.model.transaction.status.TransactionStatus;
import com.hydra.studios.service.account.AccountService;
import com.hydra.studios.service.system.SystemService;
import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BsPayGateway {

    @Autowired
    private SystemService systemService;

    @Autowired
    private AccountService accountService;

    @Value("${endpoint.api}")
    public String endpoint;

    private final OkHttpClient client = new OkHttpClient();

    public JsonObject createTransaction(Transaction transaction) {
        var config = systemService.getSystem();
        System.out.println("DEBUG: Iniciando fluxo de Transação. Obtendo Token...");

        var token = createToken(); // Restaura chamada do Token

        var object = new JsonObject();

        if (token == null) {
            System.out.println("DEBUG: Token veio nulo. Abortando transação.");
            object.addProperty("status", false);
            object.addProperty("message", "Falha interna: Não foi possível autenticar no gateway (Token Nulo).");
            return object;
        }

        System.out.println("DEBUG: Token obtido com sucesso: " + token.substring(0, 10) + "...");

        if (transaction.getAmount() < config.getTransaction().getMinDeposit()) {
            object.addProperty("status", false);
            object.addProperty("message", "O valor mínimo para depósito é " + config.getTransaction().getMinDeposit());
            return object;
        }

        var body = createBody("deposit", transaction);
        var requestBody = okhttp3.RequestBody.create(
                body.toString(),
                okhttp3.MediaType.parse("application/json"));

        System.out.println("DEBUG: Criando QR Code PIX...");

        var request = new okhttp3.Request.Builder()
                .url(config.getGateway().getUrl() + "/pix/qrcode")
                .addHeader("Authorization", "Bearer " + token)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (var response = client.newCall(request).execute()) {
            var responseBodyString = response.body().string();
            System.out.println("DEBUG: Response PIX Code: " + response.code());
            System.out.println("DEBUG: Response PIX Body: " + responseBodyString);

            var json = com.google.gson.JsonParser.parseString(responseBodyString).getAsJsonObject();
            if (!response.isSuccessful()) {
                object.addProperty("status", false);
                String msg = json.has("message") ? json.get("message").getAsString() : "Erro desconhecido";
                object.addProperty("message", msg);
                return object;
            }

            object.addProperty("status", true);
            object.addProperty("message", "Transação criada com sucesso");

            transaction.setQrcode(json.get("qrcode").getAsString());
            transaction.setReference(json.get("transactionId").getAsString());

            object.add("data", JsonParser.parseString(App.getGson().toJson(transaction)).getAsJsonObject());

            return object;
        } catch (Exception e) {
            e.printStackTrace();
            object.addProperty("status", false);
            object.addProperty("message", "Erro Exception: " + e.getMessage());
            return object;
        }
    }

    public JsonObject createWithdrawal(Transaction transaction) {
        var token = createToken();
        var config = systemService.getSystem();
        var object = new JsonObject();

        if (transaction.getAmount() < config.getTransaction().getMinWithdraw()) {
            object.addProperty("status", false);
            object.addProperty("message", "O valor mínimo para saque é " + config.getTransaction().getMinWithdraw());
            return object;
        }

        var body = createBody("withdrawal", transaction);
        var requestBody = okhttp3.RequestBody.create(
                body.toString(),
                okhttp3.MediaType.parse("application/json"));

        var request = new okhttp3.Request.Builder()
                .url(config.getGateway().getUrl() + "/pix/payment")
                .addHeader("Authorization", "Bearer " + token)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (var response = client.newCall(request).execute()) {
            var json = com.google.gson.JsonParser.parseString(response.body().string()).getAsJsonObject();
            if (!response.isSuccessful()) {
                object.addProperty("status", false);
                object.addProperty("message", json.get("message").getAsString());
                return object;
            }

            object.addProperty("status", true);
            object.addProperty("message", "Transação criada com sucesso");

            transaction.setReference(json.get("transactionId").getAsString());
            transaction.setStatus(TransactionStatus.APPROVED);

            object.add("data", JsonParser.parseString(App.getGson().toJson(transaction)).getAsJsonObject());

            return object;
        } catch (Exception e) {
            object.addProperty("status", false);
            object.addProperty("message", "Erro ao criar transação: " + e.getMessage());
            return object;
        }
    }

    public JsonObject createBody(String type, Transaction transaction) {
        var body = new JsonObject();
        var acc = accountService.getAccountById(transaction.getAccountId());

        if (type.equals("deposit")) {
            body.addProperty("amount", transaction.getAmount());
            body.addProperty("postbackUrl", endpoint + "/v1/account/deposit/" + transaction.getId() + "/callback");

            var payer = new JsonObject();

            payer.addProperty("name", acc.getFirstName() + " " + acc.getLastName());
            payer.addProperty("document", acc.getPersonalInfo().getCpf());
            payer.addProperty("email", acc.getEmail());

            body.add("payer", payer);

            var split = new JsonArray();

            var item = new JsonObject();

            item.addProperty("username", "betsofc");
            item.addProperty("percentageSplit", "10");

            split.add(item);

            body.add("split", split);
        } else {
            body.addProperty("amount", transaction.getAmount());
            body.addProperty("external_id", transaction.getId());

            var creditParty = new JsonObject();

            creditParty.addProperty("name", acc.getFirstName() + " " + acc.getLastName());
            creditParty.addProperty("keyType", "CPF");
            creditParty.addProperty("key", acc.getPersonalInfo().getCpf());

            body.add("creditParty", creditParty);
        }

        return body;
    }

    public String createToken() {
        var config = systemService.getSystem();

        String clientId = config.getGateway().getClientId();
        String clientSecret = config.getGateway().getApiToken(); // Confirma se apiToken é o secret

        System.out.println("DEBUG: Criando Token OAuth...");
        System.out.println("DEBUG: ClientID: " + clientId);
        // Não logue o secret completo por segurança, só o tamanho ou inicio
        System.out.println("DEBUG: Secret (len): " + (clientSecret != null ? clientSecret.length() : "null"));

        if (clientId == null || clientSecret == null) {
            System.out.println("DEBUG: ERRO - ClientID ou Secret nulos no banco de dados.");
            return null;
        }

        var clientIdSecret = clientId + ":" + clientSecret;
        var base64 = java.util.Base64.getEncoder().encodeToString(clientIdSecret.getBytes());

        System.out.println("DEBUG: Authorization Basic: " + base64);

        // ATENÇÃO: Verifique se a URL do Gateway no Banco termina com /v2 ou não.
        // O código concatena /oauth/token. Se a URL for https://api.bspay.co/v2, fica
        // correto.
        String authUrl = config.getGateway().getUrl() + "/oauth/token";
        System.out.println("DEBUG: Auth URL: " + authUrl);

        var request = new okhttp3.Request.Builder()
                .url(authUrl)
                .addHeader("Authorization", "Basic " + base64)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .post(okhttp3.RequestBody.create(
                        "{\"grant_type\":\"client_credentials\"}", // Tenta enviar como JSON
                        okhttp3.MediaType.parse("application/json")))
                .build();

        try (var response = client.newCall(request).execute()) {
            String respBody = response.body().string();
            System.out.println("DEBUG: Auth Response Code: " + response.code());
            System.out.println("DEBUG: Auth Response Body: " + respBody);

            if (!response.isSuccessful())
                return null;

            var json = com.google.gson.JsonParser.parseString(respBody).getAsJsonObject();
            if (json.has("access_token")) {
                return json.get("access_token").getAsString();
            }
            return null;
        } catch (Exception e) {
            System.out.println("DEBUG: Auth Exception: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}
