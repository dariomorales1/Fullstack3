package cl.fullstack3.pedidos360.audit.service;

import cl.fullstack3.pedidos360.audit.domain.AuditoriaEvento;
import cl.fullstack3.pedidos360.audit.messaging.OrderEvent;
import cl.fullstack3.pedidos360.audit.repository.AuditoriaRepository;
import cl.fullstack3.pedidos360.audit.repository.AuditoriaSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuditoriaService {

    private final AuditoriaRepository repository;

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public AuditoriaEvento registrar(OrderEvent evento) {
        AuditoriaEvento e = new AuditoriaEvento();
        e.setEventType(evento.eventType());
        e.setPedidoId(evento.pedidoId());
        e.setClienteId(evento.clienteId());
        e.setEstado(evento.estado());
        e.setTotal(evento.total());
        e.setOcurridoEn(evento.ocurridoEn());
        return repository.save(e);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaEvento> buscar(String clienteId, String eventType, Instant from, Instant to) {
        Specification<AuditoriaEvento> spec = Specification.where(AuditoriaSpecs.conCliente(clienteId))
                .and(AuditoriaSpecs.conTipo(eventType))
                .and(AuditoriaSpecs.desde(from))
                .and(AuditoriaSpecs.hasta(to));
        return repository.findAll(spec, Sort.by(Sort.Direction.DESC, "ocurridoEn"));
    }
}
