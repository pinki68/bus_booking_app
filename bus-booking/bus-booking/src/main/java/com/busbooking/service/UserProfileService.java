package com.busbooking.service;



import com.busbooking.entity.PaymentCard;
import com.busbooking.entity.UserProfile;
import com.busbooking.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
public class UserProfileService {
    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    public UserProfile getUserProfile(Long userId) {
        return userProfileRepository.findByUserId(userId);
    }

    @Transactional
    public UserProfile updateProfile(UserProfile profile) {
        return userProfileRepository.save(profile);
    }

    @Transactional
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        UserProfile profile = getUserProfile(userId);
        if (profile != null && passwordEncoder.matches(currentPassword, profile.getUser().getPassword())) {
            profile.getUser().setPassword(passwordEncoder.encode(newPassword));
            userProfileRepository.save(profile);
        } else {
            throw new RuntimeException("Current password is incorrect");
        }
    }

    @Transactional
    public PaymentCard addPaymentCard(Long userId, PaymentCard paymentCard) {
        UserProfile profile = getUserProfile(userId);
        paymentCard.setUserProfile(profile);
        profile.getPaymentCards().add(paymentCard);
        userProfileRepository.save(profile);
        return paymentCard;
    }

    @Transactional
    public void removePaymentCard(Long userId, Long paymentCardId) {
        UserProfile profile = getUserProfile(userId);
        profile.getPaymentCards().removeIf(pc -> pc.getId().equals(paymentCardId));
        userProfileRepository.save(profile);
    }
} 