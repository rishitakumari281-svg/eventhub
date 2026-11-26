package com.eventhub.entity;

import jakarta.persistence.*;

/** A non-leader member of a team registration. The leader is the registration's user. */
@Entity
@Table(name = "team_members")
public class TeamMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "registration_id")
    private Registration registration;

    @Column(nullable = false, length = 80) private String name;
    @Column(nullable = false, length = 160) private String email;

    protected TeamMember() {}

    public TeamMember(Registration registration, String name, String email) {
        this.registration = registration;
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public Registration getRegistration() { return registration; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}
