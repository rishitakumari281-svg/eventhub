package com.eventhub.repository;

import com.eventhub.entity.Registration;
import com.eventhub.entity.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    long countByEventIdAndStatus(Long eventId, RegistrationStatus status);
    long countByEventId(Long eventId);

    @Query("select count(m) from TeamMember m where m.registration.event.id = :eventId and m.registration.status = :status")
    long countMembers(@Param("eventId") Long eventId, @Param("status") RegistrationStatus status);

    Optional<Registration> findByUserIdAndEventIdAndStatus(Long userId, Long eventId, RegistrationStatus status);
    List<Registration> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, RegistrationStatus status);
    List<Registration> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Registration> findByIdAndUserId(Long id, Long userId);

    List<Registration> findByEventIdAndStatusOrderByCreatedAtDesc(Long eventId, RegistrationStatus status);
    long countByStatus(RegistrationStatus status);
    long countByStatusAndCheckedInAtIsNotNull(RegistrationStatus status);
}

