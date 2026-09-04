-- Structured form sections with conditional visibility
CREATE TABLE `FormSection` (
    `id` VARCHAR(191) NOT NULL,
    `formId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL,
    `logic` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `FormSection_formId_order_idx`(`formId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FormTemplateSection` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL,
    `logic` JSON NULL,
    INDEX `FormTemplateSection_templateId_order_idx`(`templateId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Question` ADD COLUMN `sectionId` VARCHAR(191) NULL;
ALTER TABLE `FormTemplateQuestion` ADD COLUMN `sectionId` VARCHAR(191) NULL;

CREATE INDEX `Question_sectionId_idx` ON `Question`(`sectionId`);
CREATE INDEX `FormTemplateQuestion_sectionId_idx` ON `FormTemplateQuestion`(`sectionId`);

ALTER TABLE `Question` ADD CONSTRAINT `Question_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `FormSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FormTemplateQuestion` ADD CONSTRAINT `FormTemplateQuestion_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `FormTemplateSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FormSection` ADD CONSTRAINT `FormSection_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `Form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FormTemplateSection` ADD CONSTRAINT `FormTemplateSection_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `FormTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove legacy section-break question rows
DELETE FROM `Question` WHERE `type` = 'SECTION';
DELETE FROM `FormTemplateQuestion` WHERE `type` = 'SECTION';

ALTER TABLE `Question` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'COMMENT', 'SUGGESTION', 'RATING', 'RESOURCE_RATING', 'YES_NO', 'DATE') NOT NULL;
ALTER TABLE `FormTemplateQuestion` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'COMMENT', 'SUGGESTION', 'RATING', 'RESOURCE_RATING', 'YES_NO', 'DATE') NOT NULL;
