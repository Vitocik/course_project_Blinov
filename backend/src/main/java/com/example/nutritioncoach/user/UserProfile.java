package com.example.nutritioncoach.user;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "profiles")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    @Column(nullable = false)
    private Integer age = 20;

    @Column(nullable = false)
    private String sex = "female";

    @Column(nullable = false)
    private Integer heightCm = 168;

    @Column(nullable = false)
    private Double weightKg = 60.0;

    @Column(nullable = false)
    private String activity = "moderate";

    @Column(nullable = false)
    private String goal = "maintain";

    @Column(nullable = false)
    private Integer trainingDays = 3;

    @Column(length = 500)
    private String allergies = "";

    @Column(length = 1000)
    private String notes = "";

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserProfile() {}

    public UserProfile(UserAccount user) {
        this.user = user;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserAccount getUser() { return user; }
    public void setUser(UserAccount user) { this.user = user; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }

    public Integer getHeightCm() { return heightCm; }
    public void setHeightCm(Integer heightCm) { this.heightCm = heightCm; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public String getActivity() { return activity; }
    public void setActivity(String activity) { this.activity = activity; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public Integer getTrainingDays() { return trainingDays; }
    public void setTrainingDays(Integer trainingDays) { this.trainingDays = trainingDays; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
