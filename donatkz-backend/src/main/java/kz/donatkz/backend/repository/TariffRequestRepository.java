package kz.donatkz.backend.repository;

import kz.donatkz.backend.model.TariffRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TariffRequestRepository extends JpaRepository<TariffRequest, Long> {
    List<TariffRequest> findAllByOrderByCreatedAtDesc();
    List<TariffRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<TariffRequest> findByStatusOrderByCreatedAtDesc(String status);
}

