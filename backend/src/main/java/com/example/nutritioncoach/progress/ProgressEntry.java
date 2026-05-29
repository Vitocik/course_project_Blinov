package com.example.nutritioncoach.progress;

import com.example.nutritioncoach.user.UserAccount;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "progress_entries")
public class ProgressEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false)
    private Double weightKg;

    @Column(length = 500)
    private String note = "";

    public ProgressEntry() {}

    public ProgressEntry(UserAccount user, LocalDate entryDate, Double weightKg, String note) {
        this.user = user;
        this.entryDate = entryDate;
        this.weightKg = weightKg;
        this.note = note;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
