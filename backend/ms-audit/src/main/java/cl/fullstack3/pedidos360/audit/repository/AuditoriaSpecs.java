package cl.fullstack3.pedidos360.audit.repository;

import cl.fullstack3.pedidos360.audit.domain.AuditoriaEvento;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;

public final class AuditoriaSpecs {

    private AuditoriaSpecs() {
    }

    public static Specification<AuditoriaEvento> conCliente(String clienteId) {
        return (r, q, cb) -> clienteId == null ? null : cb.equal(r.get("clienteId"), clienteId);
    }

    public static Specification<AuditoriaEvento> conTipo(String eventType) {
        return (r, q, cb) -> eventType == null ? null : cb.equal(r.get("eventType"), eventType);
    }

    public static Specification<AuditoriaEvento> desde(Instant from) {
        return (r, q, cb) -> from == null ? null : cb.greaterThanOrEqualTo(r.get("ocurridoEn"), from);
    }

    public static Specification<AuditoriaEvento> hasta(Instant to) {
        return (r, q, cb) -> to == null ? null : cb.lessThanOrEqualTo(r.get("ocurridoEn"), to);
    }
}
