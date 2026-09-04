-- Legacy SLIDER field type was removed from the app; convert existing rows.
UPDATE `Question` SET `type` = 'RATING' WHERE `type` = 'SLIDER';
UPDATE `FormTemplateQuestion` SET `type` = 'RATING' WHERE `type` = 'SLIDER';

-- Drop SLIDER from the MySQL enum (safe if already absent).
ALTER TABLE `Question` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'COMMENT', 'SUGGESTION', 'RATING', 'RESOURCE_RATING', 'YES_NO', 'SECTION', 'DATE') NOT NULL;
ALTER TABLE `FormTemplateQuestion` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'COMMENT', 'SUGGESTION', 'RATING', 'RESOURCE_RATING', 'YES_NO', 'SECTION', 'DATE') NOT NULL;
