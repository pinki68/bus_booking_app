package com.busbooking.repository;

import com.busbooking.entity.Role;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
	//Optional<Role> findByName(String name);
    
    // Check if a role with the given name exists
   // boolean existsByName(String name);
    
    @Query("SELECT r FROM Role r WHERE r.name = :name")
    Optional<Role> findByName(@Param("name") String name);
    
    // Check if a role with the given name exists
   // boolean existsByName(String name);
    
    
    // Check if a role with the given name exists
    @Query("SELECT COUNT(r) > 0 FROM Role r WHERE r.name = :name")
    boolean existsByName(@Param("name") String name);
    
    
    // Add a role to a user using direct SQL for the join table
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId) ON DUPLICATE KEY UPDATE user_id = user_id", nativeQuery = true)
    void addRoleToUser(@Param("userId") Long userId, @Param("roleId") Long roleId);
    
    // Find role by name - force case insensitive using SQL directly
    @Query(value = "SELECT * FROM roles WHERE LOWER(name) = LOWER(:name) LIMIT 1", nativeQuery = true)
    Optional<Role> findByNameCaseInsensitive(@Param("name") String name);


} 