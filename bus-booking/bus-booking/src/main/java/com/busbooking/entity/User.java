package com.busbooking.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


//import lombok.Data;

import lombok.Getter;
import lombok.Setter;

//@Data
@Getter
@Setter
@Entity
@Table(name = "users")
@ToString(exclude = {"roles", "bookings"})
@EqualsAndHashCode(exclude = {"roles", "bookings"})
public class User {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String fullName;

	@Column
	private String phoneNumber;
	
	
	@Column(nullable = false)
	private String role = "USER";

	@Column(nullable = false)
	private Boolean enabled;

	
	
	public User() {
	    this.enabled = true;
	}
	
	
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public List<Booking> getBookings() {
		return bookings;
	}

	public void setBookings(List<Booking> bookings) {
		this.bookings = bookings;
	}
	
	
	

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	


	public Boolean getEnabled() {
		return enabled;
	}

	public void setEnabled(Boolean enabled) {
		this.enabled = enabled;
	}




	@OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
	private List<Booking> bookings;


    
    //@ManyToMany(fetch = FetchType.EAGER)
    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.MERGE, CascadeType.REFRESH})
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    
    // Method to add a role to the user with proper bidirectional relationship
    public void addRole(Role role) {
        if (role != null) {
            roles.add(role);
            if (role.getUsers() != null) {
                role.getUsers().add(this);
            }
        }
    }
    
    // Method to remove a role from the user with proper bidirectional relationship
    public void removeRole(Role role) {
        if (role != null) {
            roles.remove(role);
            if (role.getUsers() != null) {
                role.getUsers().remove(this);
            }
        }
    }
	
}