package cl.fullstack3.msfinance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsFinanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsFinanceApplication.class, args);
    }

}
