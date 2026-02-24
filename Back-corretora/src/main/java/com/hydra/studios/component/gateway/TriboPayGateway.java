package com.hydra.studios.component.gateway;

import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
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
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

import static org.springframework.http.RequestEntity.post;

@Component
public class TriboPayGateway {

    @Autowired
    private SystemService systemService;

    @Autowired
    private AccountService accountService;

    @Value("${endpoint.api}")
    public String endpoint;

    private final OkHttpClient client = new OkHttpClient();

    public JsonObject createTransaction(Transaction transaction) throws IOException {
        var config = systemService.getSystem();

        var object = new JsonObject();

        if (transaction.getAmount() < config.getTransaction().getMinDeposit()) {
            object.addProperty("status", false);
            object.addProperty("message", "O valor mínimo para depósito é " + config.getTransaction().getMinDeposit());
            return object;
        }

        var body = createBody("deposit", transaction);

        System.out.println("DEBUG: JSON enviado para TriboPay: " + body.toString());

        var requestBody = RequestBody.create(
                body.toString(),
                okhttp3.MediaType.parse("application/json; charset=utf-8"));

        System.out.println("DEBUG: Iniciando transação TriboPay...");
        System.out.println("DEBUG: URL Gateway: " + config.getGateway().getUrl());
        // Logar apenas parte do token por segurança
        String token = config.getGateway().getApiToken();
        System.out.println("DEBUG: Token existe? " + (token != null && !token.isEmpty()));

        var request = new Request.Builder()
                .url(config.getGateway().getUrl() + "/transactions?api_token=" + config.getGateway().getApiToken())
                .addHeader("Content-Type", "application/json") // Força o header
                .addHeader("Accept", "application/json")
                .post(requestBody)
                .build();

        System.out.println("DEBUG: Request URL completa: " + request.url());

        try (var response = client.newCall(request).execute()) {
            var responseString = response.body().string();
            System.out.println("DEBUG: TriboPay Response Code: " + response.code());
            System.out.println("DEBUG: TriboPay Response Body: " + responseString);

            var json = JsonParser.parseString(responseString).getAsJsonObject();

            if (response.isSuccessful()) { // Verifica HTTP 200/201
                // Extrai dados do PIX
                if (json.has("pix") && json.getAsJsonObject("pix").has("pix_qr_code")) {
                    transaction.setQrcode(json.getAsJsonObject("pix").get("pix_qr_code").getAsString());
                }

                // Extrai ID da Transação (pode ser "transaction" string ou "id" int)
                if (json.has("transaction")) {
                    transaction.setReference(json.get("transaction").getAsString());
                } else if (json.has("id")) {
                    transaction.setReference(json.get("id").getAsString());
                }

                object.addProperty("status", true);
                object.add("data", App.getGson().toJsonTree(transaction));

                return object;
            } else {
                object.addProperty("status", false);
                object.add("response", json);
                object.add("body", body);

                String errorMsg = "Erro desconhecido";
                if (json.has("message"))
                    errorMsg = json.get("message").getAsString();
                else if (json.has("errors"))
                    errorMsg = json.get("errors").toString();

                object.addProperty("message", "Erro TriboPay: " + errorMsg);

                return object;
            }
        }
    }

    private JsonObject createBody(String type, Transaction transaction) {
        var acc = accountService.getAccountById(transaction.getAccountId());
        var body = new JsonObject();

        // Conversão para centavos (Ex: 150.00 -> 15000)
        long amountInCents = (long) (transaction.getAmount() * 100);

        if (type.equals("deposit")) {
            body.addProperty("amount", amountInCents);
            // IMPORTANTE: "offer_hash" geralmente é fixo por produto na TriboPay.
            // Se falhar com ID dinâmico, o usuário deverá fornecer o hash correto da oferta
            // criada no painel deles.
            body.addProperty("offer_hash", transaction.getId().substring(0, Math.min(transaction.getId().length(), 8)));

            body.addProperty("payment_method", "pix");
            body.addProperty("installments", 1);
            body.addProperty("expire_in_days", 1);
            body.addProperty("transaction_origin", "api");

            var customer = new JsonObject();
            customer.addProperty("name", acc.getFirstName() + " " + acc.getLastName());
            customer.addProperty("email", acc.getEmail());
            // Remove caracteres não numéricos. Se fallback for necessário, use um fixo
            // válido para teste
            String phone = acc.getPersonalInfo().getPhone() != null
                    ? acc.getPersonalInfo().getPhone().replaceAll("\\D", "")
                    : "11999999999";
            customer.addProperty("phone_number", phone);

            String doc = acc.getPersonalInfo().getCpf() != null ? acc.getPersonalInfo().getCpf().replaceAll("\\D", "")
                    : "00000000000";
            customer.addProperty("document", doc);

            // Endereço (Dados reais ou padrão para evitar 422)
            var address = acc.getPersonalInfo().getAddress();
            customer.addProperty("street_name",
                    address != null && address.getStreet() != null ? address.getStreet() : "Rua Default");
            customer.addProperty("number", "0");
            customer.addProperty("neighborhood", "Centro");
            customer.addProperty("city", address != null && address.getCity() != null ? address.getCity() : "Cidade");
            customer.addProperty("state", address != null && address.getState() != null ? address.getState() : "SP");
            customer.addProperty("zip_code",
                    address != null && address.getZipCode() != null ? address.getZipCode().replaceAll("\\D", "")
                            : "00000000");

            body.add("customer", customer);

            var cart = new JsonArray();
            var item = new JsonObject();

            item.addProperty("product_hash", "deposit"); // Hash do produto, pode precisar ajuste
            item.addProperty("title", "Depósito em conta");
            item.add("cover", JsonNull.INSTANCE);
            item.addProperty("price", amountInCents);
            item.addProperty("quantity", 1);
            item.addProperty("operation_type", 1);
            item.addProperty("tangible", false);

            cart.add(item);
            body.add("cart", cart);

            body.addProperty("postback_url", endpoint + "/v1/account/deposit/" + transaction.getId() + "/callback");
        }

        // Se precisar de withdraw no futuro, adicione else if aqui.

        return body;
    }
}
