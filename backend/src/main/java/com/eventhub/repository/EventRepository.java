package com.eventhub.repository;

import com.eventhub.entity.Event;
import com.eventhub.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatusOrderByDateAscTimeAsc(EventStatus status);
    List<Event> findByOrganizerIdOrderByDateAscTimeAsc(Long organizerId);
}
