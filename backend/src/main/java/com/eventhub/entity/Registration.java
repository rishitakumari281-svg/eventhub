package com.eventhub.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * One row per registration (individual or team). Mapped now so seat counts work;
 * the register / cancel / check-in endpoints are built in Stage 5.
 * Duplicate prevention is enforced in the service layer (a DB unique key on user+event
 * would block re-registering after a cancellation).
 */
@Entity
@Table(name = "registrations")
public class Registration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false) @JoinColumn(name = "event_id")
    private Event event;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.CONFIRMED;

    /** Random, unguessable ID that the QR code will carry (validated against this table). */
    @Column(nullable = false, unique = true, length = 40)
    private String ticketId;

    @Column(length = 60) private String teamName;

    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> members = new ArrayList<>();

    @Column(nullable = false) private Instant createdAt = Instant.now();
    private Instant cancelledAt;
    private Instant checkedInAt; // set once when the ticket is scanned; null = not attended yet

    protected Registration() {}

    public Registration(User user, Event event, String ticketId, String teamName) {
        this.user = user;
        this.event = event;
        this.ticketId = ticketId;
        this.teamName = teamName;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }                 public void setUser(User v) { user = v; }
    public Event getEvent() { return event; }              public void setEvent(Event v) { event = v; }
    public RegistrationStatus getStatus() { return status; } public void setStatus(RegistrationStatus v) { status = v; }
    public String getTicketId() { return ticketId; }       public void setTicketId(String v) { ticketId = v; }
    public String getTeamName() { return teamName; }       public void setTeamName(String v) { teamName = v; }
    public List<TeamMember> getMembers() { return members; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCancelledAt() { return cancelledAt; } public void setCancelledAt(Instant v) { cancelledAt = v; }
    public Instant getCheckedInAt() { return checkedInAt; } public void setCheckedInAt(Instant v) { checkedInAt = v; }
}

