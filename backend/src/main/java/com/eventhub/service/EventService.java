package com.eventhub.service;

import com.eventhub.dto.EventDto;
import com.eventhub.dto.EventRequest;
import com.eventhub.dto.ScheduleItem;
import com.eventhub.entity.*;
import com.eventhub.exception.ApiException;
import com.eventhub.repository.CategoryRepository;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.RegistrationRepository;
import com.eventhub.repository.UserRepository;
import com.eventhub.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {
    private final EventRepository events;
    private final CategoryRepository categories;
    private final RegistrationRepository registrations;
    private final UserRepository users;

    public EventService(EventRepository events, CategoryRepository categories,
                        RegistrationRepository registrations, UserRepository users) {
        this.events = events;
        this.categories = categories;
        this.registrations = registrations;
        this.users = users;
    }

    /* ---------- reads ---------- */

    @Transactional(readOnly = true)
    public List<EventDto> listPublic() {
        return events.findByStatusOrderByDateAscTimeAsc(EventStatus.ACTIVE).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public EventDto getPublic(Long id) {
        Event e = find(id);
        if (e.getStatus() != EventStatus.ACTIVE) throw notFound();
        return toDto(e);
    }

    /** Organizers see their own events (including archived); admins see everything. */
    @Transactional(readOnly = true)
    public List<EventDto> listMine(AuthUser user) {
        List<Event> list = user.role() == Role.ADMIN
                ? events.findAll().stream().sorted(Comparator.comparing(Event::getDate)).toList()
                : events.findByOrganizerIdOrderByDateAscTimeAsc(user.id());
        return list.stream().map(this::toDto).toList();
    }

    /* ---------- writes (organizer/admin; ownership is checked here, not only in the URL rules) ---------- */

    @Transactional
    public EventDto create(EventRequest r, AuthUser user) {
        if (r.date().isBefore(LocalDate.now())) throw bad("The event date cannot be in the past.");
        User organizer = users.findById(user.id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));
        Event e = new Event();
        e.setOrganizer(organizer);
        apply(e, r);
        return toDto(events.save(e));
    }

    @Transactional
    public EventDto update(Long id, EventRequest r, AuthUser user) {
        Event e = find(id);
        requireOwnerOrAdmin(e, user);
        if (e.getStatus() == EventStatus.ARCHIVED) throw bad("Archived events cannot be edited.");
        int taken = seatsTaken(e);
        if (r.seats() < taken) throw bad("Seats cannot be fewer than the " + taken + " already registered.");
        if (taken > 0 && r.type() != e.getType()) throw bad("The event type cannot change once people have registered.");
        apply(e, r);
        return toDto(events.save(e));
    }

    /** DELETE archives rather than erasing, so students keep their registration history. */
    @Transactional
    public void archive(Long id, AuthUser user) {
        Event e = find(id);
        requireOwnerOrAdmin(e, user);
        e.setStatus(EventStatus.ARCHIVED);
        events.save(e);
    }

    /** Permanently delete only events that have never had registrations. */
    @Transactional
    public void permanentlyDelete(Long id, AuthUser user) {
        if (user.role() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only admins can permanently delete events.");
        }

        Event e = find(id);

        if (registrations.countByEventId(id) > 0) {
            throw bad("This event has registration history and cannot be permanently deleted. Archive it instead.");
        }

        events.delete(e);
    }

    /* ---------- helpers ---------- */

    private void apply(Event e, EventRequest r) {
        if (r.registrationDeadline().isAfter(r.date())) {
            throw bad("The registration deadline must be on or before the event date.");
        }
        int min = 1, max = 1;
        if (r.type() == EventType.TEAM) {
            min = r.teamMin() == null ? 2 : r.teamMin();
            max = r.teamMax() == null ? Math.max(min, 4) : r.teamMax();
            if (min < 2) throw bad("Team events need a minimum team size of at least 2.");
            if (max < min || max > 50) throw bad("Maximum team size must be between the minimum and 50.");
        }
        Category category = categories.findBySlug(r.category()).orElseThrow(() -> bad("Unknown category."));

        e.setTitle(r.title().trim());
        e.setSummary(r.summary().trim());
        e.setDescription(r.description() == null ? null : r.description().trim());
        e.setCategory(category);
        e.setType(r.type());
        e.setDate(r.date());
        e.setTime(r.time());
        e.setVenue(r.venue().trim());
        e.setOrganizerName(r.organizerName().trim());
        e.setSeats(r.seats());
        e.setTeamMin(min);
        e.setTeamMax(max);
        e.setRegistrationDeadline(r.registrationDeadline());
        e.setEligibility(r.eligibility());
        e.setFeatured(r.featured());
        e.setSchedule(formatSchedule(r.schedule()));
    }

    private void requireOwnerOrAdmin(Event e, AuthUser user) {
        boolean owner = e.getOrganizer().getId().equals(user.id());
        if (user.role() != Role.ADMIN && !owner) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only modify your own events.");
        }
    }

    private Event find(Long id) {
        return events.findById(id).orElseThrow(EventService::notFound);
    }

    private static ApiException notFound() { return new ApiException(HttpStatus.NOT_FOUND, "Event not found."); }
    private static ApiException bad(String msg) { return new ApiException(HttpStatus.BAD_REQUEST, msg); }

    /** Seats used = confirmed registrations (leaders/individuals) + confirmed team members. */
    private int seatsTaken(Event e) {
        return (int) (registrations.countByEventIdAndStatus(e.getId(), RegistrationStatus.CONFIRMED)
                + registrations.countMembers(e.getId(), RegistrationStatus.CONFIRMED));
    }

    /** The server decides the status, so it cannot be faked from the browser. */
    private EventDto toDto(Event e) {
        int taken = seatsTaken(e);
        int left = Math.max(e.getSeats() - taken, 0);
        String status;
        if (e.getRegistrationDeadline().isBefore(LocalDate.now())) status = "CLOSED";
        else if (left == 0) status = "FULL";
        else if ((double) left / e.getSeats() <= 0.2) status = "FILLING";
        else status = "OPEN";

        return new EventDto(e.getId(), e.getTitle(), e.getSummary(), e.getDescription(),
                e.getCategory().getSlug(), e.getCategory().getName(),
                e.getType() == EventType.TEAM ? "Team" : "Individual",
                e.getDate(), e.getTime(), e.getVenue(), e.getOrganizerName(),
                e.getSeats(), taken, left, e.getRegistrationDeadline(), e.getEligibility(),
                e.getTeamMin(), e.getTeamMax(), parseSchedule(e.getSchedule()),
                e.isFeatured(), e.getPattern(), status, e.getStatus().name(),
                e.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate());
    }

    private static String formatSchedule(List<ScheduleItem> items) {
        if (items == null || items.isEmpty()) return null;
        return items.stream()
                .map(i -> clean(i.time()) + "|" + clean(i.title()))
                .collect(Collectors.joining("\n"));
    }

    private static String clean(String s) { return s.replace("|", " ").replace("\n", " ").trim(); }

    private static List<ScheduleItem> parseSchedule(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return raw.lines().map(line -> line.split("\\|", 2))
                .filter(p -> p.length == 2)
                .map(p -> new ScheduleItem(p[0], p[1]))
                .toList();
    }
}

