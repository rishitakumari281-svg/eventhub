package com.eventhub.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150) private String title;
    @Column(nullable = false, length = 300) private String summary;
    @Column(length = 4000) private String description;

    @ManyToOne(optional = false) @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private EventType type;

    // Explicit column names: DATE and TIME are awkward identifiers in SQL.
    @Column(name = "event_date", nullable = false) private LocalDate date;
    @Column(name = "event_time", nullable = false) private LocalTime time;

    @Column(nullable = false, length = 150) private String venue;
    @Column(nullable = false, length = 120) private String organizerName; // club/department shown to students

    /** The user account that owns (and may edit) this event. */
    @ManyToOne(optional = false) @JoinColumn(name = "organizer_id")
    private User organizer;

    @Column(nullable = false) private int seats;
    @Column(nullable = false) private int teamMin = 1;
    @Column(nullable = false) private int teamMax = 1;
    @Column(nullable = false) private LocalDate registrationDeadline;
    @Column(length = 300) private String eligibility;

    /** One line per item, formatted "label|title". Kept as text for simplicity. */
    @Column(length = 2000) private String schedule;

    @Column(nullable = false) private boolean featured;
    @Column(length = 20) private String pattern = "dots";

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private EventStatus status = EventStatus.ACTIVE;

    @Column(nullable = false) private Instant createdAt = Instant.now();

    public Event() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }                 public void setTitle(String v) { title = v; }
    public String getSummary() { return summary; }             public void setSummary(String v) { summary = v; }
    public String getDescription() { return description; }    public void setDescription(String v) { description = v; }
    public Category getCategory() { return category; }         public void setCategory(Category v) { category = v; }
    public EventType getType() { return type; }               public void setType(EventType v) { type = v; }
    public LocalDate getDate() { return date; }                public void setDate(LocalDate v) { date = v; }
    public LocalTime getTime() { return time; }                public void setTime(LocalTime v) { time = v; }
    public String getVenue() { return venue; }                 public void setVenue(String v) { venue = v; }
    public String getOrganizerName() { return organizerName; } public void setOrganizerName(String v) { organizerName = v; }
    public User getOrganizer() { return organizer; }           public void setOrganizer(User v) { organizer = v; }
    public int getSeats() { return seats; }                    public void setSeats(int v) { seats = v; }
    public int getTeamMin() { return teamMin; }                public void setTeamMin(int v) { teamMin = v; }
    public int getTeamMax() { return teamMax; }                public void setTeamMax(int v) { teamMax = v; }
    public LocalDate getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(LocalDate v) { registrationDeadline = v; }
    public String getEligibility() { return eligibility; }     public void setEligibility(String v) { eligibility = v; }
    public String getSchedule() { return schedule; }           public void setSchedule(String v) { schedule = v; }
    public boolean isFeatured() { return featured; }           public void setFeatured(boolean v) { featured = v; }
    public String getPattern() { return pattern; }             public void setPattern(String v) { pattern = v; }
    public EventStatus getStatus() { return status; }          public void setStatus(EventStatus v) { status = v; }
    public Instant getCreatedAt() { return createdAt; }
}
