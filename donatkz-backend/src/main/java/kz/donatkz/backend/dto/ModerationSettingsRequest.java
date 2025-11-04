package kz.donatkz.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ModerationSettingsRequest {

    @NotNull(message = "Статус модерации не может быть пустым")
    private Boolean moderationEnabled;

    private List<String> bannedWords;
}


