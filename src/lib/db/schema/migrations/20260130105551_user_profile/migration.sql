-- AlterTable
ALTER TABLE `Household` ADD COLUMN `createdById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `createdById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatarPath` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Household` ADD CONSTRAINT `Household_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Set createdById for existing households to the OWNER
UPDATE `Household` h
INNER JOIN `HouseholdMembership` hm ON h.id = hm.householdId AND hm.role = 'OWNER'
SET h.createdById = hm.userId
WHERE h.createdById IS NULL;

-- Data Migration: Set createdById for existing transactions to the household OWNER
UPDATE `Transaction` t
INNER JOIN `Account` a ON t.accountId = a.id
INNER JOIN `HouseholdMembership` hm ON a.householdId = hm.householdId AND hm.role = 'OWNER'
SET t.createdById = hm.userId
WHERE t.createdById IS NULL;
