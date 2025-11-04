package kz.donatkz.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String username;
    private String channelUrl;
    private String kaspiPhone;
    private String displayName;
    private String role;
    private String subscriptionTier;
}