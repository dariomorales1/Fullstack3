package cl.fullstack3.mssales;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsSalesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsSalesApplication.class, args);
    }

}
