package cl.fullstack3.mscustomer.repository;

import cl.fullstack3.mscustomer.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IContactRepository extends JpaRepository<Contact, Long> {
}
