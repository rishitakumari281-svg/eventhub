package com.eventhub.config;

import com.eventhub.entity.*;
import com.eventhub.repository.CategoryRepository;
import com.eventhub.repository.EventRepository;
import com.eventhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Optional demo data, only when SEED_DEMO=true. Dates are relative to today so the demo never
 * goes stale. Demo accounts all use the password in SEED_PASSWORD (never hard-coded).
 */
@Component
public class DataSeeder implements CommandLineRunner {
    private final boolean enabled;
    private final String password;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final EventRepository events;
    private final PasswordEncoder encoder;

    public DataSeeder(@Value("${eventhub.seed.enabled}") boolean enabled,
                      @Value("${eventhub.seed.password}") String password,
                      UserRepository users, CategoryRepository categories,
                      EventRepository events, PasswordEncoder encoder) {
        this.enabled = enabled;
        this.password = password;
        this.users = users;
        this.categories = categories;
        this.events = events;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        if (password.length() < 8 || !password.matches(".*[A-Za-z].*") || !password.matches(".*\\d.*")) {
            throw new IllegalStateException("SEED_DEMO=true needs SEED_PASSWORD (8+ chars, letters and numbers).");
        }
        if (categories.count() == 0) {
            categories.save(new Category("tech", "Technology", "Hackathons, workshops, talks"));
            categories.save(new Category("cultural", "Cultural", "Music, dance, drama, art"));
            categories.save(new Category("sports", "Sports", "Tournaments and meets"));
            categories.save(new Category("academic", "Academic", "Seminars and symposiums"));
            categories.save(new Category("career", "Career", "Placements and networking"));
            categories.save(new Category("social", "Community", "Clubs, service, social"));
        }
        ensureUser("Aarav Sharma", "demo@student.edu", Role.STUDENT);
        User organizer = ensureUser("Olivia Organizer", "organizer@student.edu", Role.ORGANIZER);
        ensureUser("Admin User", "admin@student.edu", Role.ADMIN);

        if (events.count() == 0) {
            add(organizer, "tech", "Hack the Quad 2026", EventType.TEAM, 22, "09:00", "Innovation Centre, Block C",
                "Computer Science Society", 120, 3, "A 24-hour build marathon. Form a team of up to four and ship a working prototype.", true, "grid", 2, 4,
                "09:00|Check-in & team formation\n10:00|Opening keynote\n11:00|Hacking begins\n11:00 (next day)|Demos and judging");
            add(organizer, "cultural", "Raag & Rhythm Night", EventType.INDIVIDUAL, 15, "18:30", "Open Air Amphitheatre",
                "Cultural Committee", 400, 1, "An evening of classical, fusion and indie performances by students.", false, "arcs", 1, 1,
                "18:30|Doors open\n19:00|Classical showcase\n20:00|Indie & fusion sets");
            add(organizer, "sports", "Inter-Department Cricket Cup", EventType.TEAM, 18, "08:00", "Main Sports Ground",
                "Sports Council", 3, 5, "Eight departments, one trophy. Tiny seat count on purpose: easy to fill for the 'Full' demo.", false, "stripes", 11, 15, null);
            add(organizer, "career", "Placement Prep Bootcamp", EventType.INDIVIDUAL, 25, "10:00", "Seminar Hall 2",
                "Training & Placement Cell", 200, 2, "Resume clinics, mock interviews and aptitude strategy from recruiters.", false, "dots", 1, 1, null);
            add(organizer, "academic", "Research Symposium: Climate & Cities", EventType.INDIVIDUAL, 28, "11:00", "Central Library Auditorium",
                "School of Sciences", 150, 2, "Faculty and student researchers present work on sustainable campuses.", false, "arcs", 1, 1, null);
            add(organizer, "cultural", "Open Mic & Poetry Circle", EventType.INDIVIDUAL, 8, "17:00", "Courtyard Café",
                "Literary Club", 60, 1, "Sign up to perform or simply listen. Chai included.", false, "dots", 1, 1, null);
            add(organizer, "social", "Campus Clean-Up & Tree Drive", EventType.INDIVIDUAL, 12, "07:30", "North Gate Lawns",
                "Green Campus Club", 100, 1, "Plant saplings and tidy shared spaces. Gloves and breakfast provided.", false, "stripes", 1, 1, null);
            add(organizer, "tech", "Web Dev Workshop: React in a Day", EventType.INDIVIDUAL, 5, "10:00", "Computer Lab 4",
                "Developer Student Club", 2, 2, "Hands-on session building and deploying a small React app. Only 2 seats: easy to fill for the demo.", false, "grid", 1, 1, null);
            add(organizer, "social", "Freshers' Quiz Night", EventType.TEAM, -10, "18:00", "Student Union Hall",
                "Quiz Club", 80, 2, "Teams of three battle through six rounds of trivia.", false, "dots", 3, 3, null);
        }
    }

    private User ensureUser(String name, String email, Role role) {
        return users.findByEmail(email).orElseGet(() -> users.save(new User(name, email, encoder.encode(password), role)));
    }

    private void add(User organizer, String category, String title, EventType type, int daysFromToday, String time,
                     String venue, String club, int seats, int deadlineDaysBefore, String summary,
                     boolean featured, String pattern, int teamMin, int teamMax, String schedule) {
        Event e = new Event();
        LocalDate date = LocalDate.now().plusDays(daysFromToday);
        e.setOrganizer(organizer);
        e.setCategory(categories.findBySlug(category).orElseThrow());
        e.setTitle(title);
        e.setSummary(summary);
        e.setDescription(summary + " Check the schedule and register before the deadline.");
        e.setType(type);
        e.setDate(date);
        e.setTime(LocalTime.parse(time));
        e.setVenue(venue);
        e.setOrganizerName(club);
        e.setSeats(seats);
        e.setRegistrationDeadline(date.minusDays(deadlineDaysBefore));
        e.setEligibility("Open to all enrolled students");
        e.setFeatured(featured);
        e.setPattern(pattern);
        e.setTeamMin(teamMin);
        e.setTeamMax(teamMax);
        e.setSchedule(schedule);
        events.save(e);
    }
}
