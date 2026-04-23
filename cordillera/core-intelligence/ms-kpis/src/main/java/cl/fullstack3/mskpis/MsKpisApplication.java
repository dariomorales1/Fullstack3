package cl.fullstack3.mskpis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsKpisApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsKpisApplication.class, args);
    }

}
