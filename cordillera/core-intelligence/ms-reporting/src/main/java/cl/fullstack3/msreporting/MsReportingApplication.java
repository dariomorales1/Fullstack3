package cl.fullstack3.msreporting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MsReportingApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsReportingApplication.class, args);
    }

}
