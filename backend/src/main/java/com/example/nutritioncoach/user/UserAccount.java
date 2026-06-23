package com.example.nutritioncoach.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import static com.example.nutritioncoach.user.RoleNames.USER;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String role = USER;

    public UserAccount() {}

    public UserAccount(String email, String passwordHash, String fullName) {
        this(email, passwordHash, fullName, USER);
    }

    public UserAccount(String email, String passwordHash, String fullName, String role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = normalizeRole(role);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    @PrePersist
    void initDefaults() {
        role = normalizeRole(role);
    }

    private String normalizeRole(String candidate) {
        return candidate == null || candidate.isBlank() ? USER : candidate.trim().toUpperCase();
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = normalizeRole(role); }
}
