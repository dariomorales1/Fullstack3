package cl.fullstack3.pedidos360.adminkafka.web;

import cl.fullstack3.pedidos360.adminkafka.web.dto.ConfigTopicoRequest;
import cl.fullstack3.pedidos360.adminkafka.web.dto.CrearTopicoRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.apache.kafka.clients.admin.*;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/adminkafka")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Kafka", description = "Administracion de topicos, configuraciones y consumer groups")
public class KafkaAdminController {

    private final AdminClient adminClient;

    public KafkaAdminController(AdminClient adminClient) {
        this.adminClient = adminClient;
    }

    @PostMapping("/topics")
    @Operation(summary = "Crear un topico (particiones, replicas, retencion, cleanup policy)")
    public ResponseEntity<Map<String, Object>> crearTopico(@Valid @RequestBody CrearTopicoRequest req) throws Exception {
        short replicas = (short) (req.replicas() == null ? 1 : req.replicas());
        NewTopic nuevo = new NewTopic(req.nombre(), req.particiones(), replicas);
        Map<String, String> configs = new HashMap<>();
        if (req.retencionMs() != null) {
            configs.put("retention.ms", String.valueOf(req.retencionMs()));
        }
        if (req.cleanupPolicy() != null) {
            configs.put("cleanup.policy", req.cleanupPolicy());
        }
        if (!configs.isEmpty()) {
            nuevo.configs(configs);
        }
        adminClient.createTopics(List.of(nuevo)).all().get();
        return ResponseEntity.ok(Map.of("mensaje", "Topico creado", "nombre", req.nombre(),
                "particiones", req.particiones(), "replicas", (int) replicas));
    }

    @GetMapping("/topics")
    @Operation(summary = "Listar los topicos existentes")
    public List<String> listarTopicos() throws Exception {
        return adminClient.listTopics().names().get().stream().sorted().toList();
    }

    @GetMapping("/topics/{nombre}")
    @Operation(summary = "Describir un topico (particiones, replicas y configuracion)")
    public Map<String, Object> describirTopico(@PathVariable String nombre) throws Exception {
        TopicDescription td = adminClient.describeTopics(List.of(nombre)).allTopicNames().get().get(nombre);
        int replicas = td.partitions().isEmpty() ? 0 : td.partitions().get(0).replicas().size();

        ConfigResource recurso = new ConfigResource(ConfigResource.Type.TOPIC, nombre);
        Config config = adminClient.describeConfigs(List.of(recurso)).all().get().get(recurso);
        Map<String, String> configs = new LinkedHashMap<>();
        for (ConfigEntry entry : config.entries()) {
            if (entry.name().equals("retention.ms") || entry.name().equals("cleanup.policy")) {
                configs.put(entry.name(), entry.value());
            }
        }
        return Map.of("nombre", nombre, "particiones", td.partitions().size(),
                "replicas", replicas, "config", configs);
    }

    @DeleteMapping("/topics/{nombre}")
    @Operation(summary = "Eliminar un topico")
    public Map<String, Object> eliminarTopico(@PathVariable String nombre) throws Exception {
        adminClient.deleteTopics(List.of(nombre)).all().get();
        return Map.of("nombre", nombre, "eliminado", true);
    }

    @PutMapping("/topics/{nombre}/config")
    @Operation(summary = "Modificar la configuracion de un topico (retencion / cleanup policy)")
    public Map<String, Object> actualizarConfig(@PathVariable String nombre,
                                                @RequestBody ConfigTopicoRequest req) throws Exception {
        ConfigResource recurso = new ConfigResource(ConfigResource.Type.TOPIC, nombre);
        List<AlterConfigOp> ops = new ArrayList<>();
        if (req.retencionMs() != null) {
            ops.add(new AlterConfigOp(new ConfigEntry("retention.ms", String.valueOf(req.retencionMs())),
                    AlterConfigOp.OpType.SET));
        }
        if (req.cleanupPolicy() != null) {
            ops.add(new AlterConfigOp(new ConfigEntry("cleanup.policy", req.cleanupPolicy()),
                    AlterConfigOp.OpType.SET));
        }
        if (ops.isEmpty()) {
            throw new IllegalArgumentException("Debe indicar retencionMs y/o cleanupPolicy");
        }
        adminClient.incrementalAlterConfigs(Map.of(recurso, ops)).all().get();
        return Map.of("nombre", nombre, "mensaje", "Configuracion actualizada");
    }

    @GetMapping("/consumer-groups")
    @Operation(summary = "Listar los consumer groups")
    public List<String> listarConsumerGroups() throws Exception {
        return adminClient.listConsumerGroups().all().get().stream()
                .map(ConsumerGroupListing::groupId).sorted().toList();
    }
}
