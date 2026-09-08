-- AlterEnum
ALTER TABLE `Form` MODIFY COLUMN `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED') NOT NULL DEFAULT 'DRAFT';

-- Close forms that already have at least one submitted response
UPDATE `Form` f
SET f.`status` = 'CLOSED'
WHERE EXISTS (
  SELECT 1
  FROM `ClientSurvey` cs
  INNER JOIN `Response` r ON r.`clientSurveyId` = cs.`id`
  WHERE cs.`formId` = f.`id`
);
