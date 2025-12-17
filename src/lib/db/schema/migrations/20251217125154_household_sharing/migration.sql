/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Household` table. All the data in the column will be lost.
  - The primary key for the `HouseholdMembership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accessLevel` on the `HouseholdMembership` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Category` DROP FOREIGN KEY `Category_householdId_fkey`;

-- DropForeignKey
ALTER TABLE `Counterparty` DROP FOREIGN KEY `Counterparty_householdId_fkey`;

-- DropForeignKey
ALTER TABLE `Household` DROP FOREIGN KEY `Household_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `HouseholdMembership` DROP FOREIGN KEY `HouseholdMembership_householdId_fkey`;

-- DropForeignKey
ALTER TABLE `ImportJob` DROP FOREIGN KEY `ImportJob_householdId_fkey`;

-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_householdId_fkey`;

-- DropIndex
DROP INDEX `Category_householdId_fkey` ON `Category`;

-- DropIndex
DROP INDEX `Counterparty_householdId_fkey` ON `Counterparty`;

-- DropIndex
DROP INDEX `Household_ownerId_fkey` ON `Household`;

-- DropIndex
DROP INDEX `HouseholdMembership_householdId_fkey` ON `HouseholdMembership`;

-- DropIndex
DROP INDEX `ImportJob_householdId_fkey` ON `ImportJob`;

-- DropIndex
DROP INDEX `Tag_householdId_fkey` ON `Tag`;

-- AlterTable
ALTER TABLE `AdminSettings` ADD COLUMN `allowHouseholdAdminsToInviteUsers` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable (prepare HouseholdMembership for owner memberships)
ALTER TABLE `HouseholdMembership` DROP PRIMARY KEY,
    DROP COLUMN `accessLevel`,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL,
    ADD PRIMARY KEY (`id`);

-- Data migration: create OWNER membership for each existing household owner
INSERT INTO `HouseholdMembership` (`id`, `createdAt`, `userId`, `householdId`, `role`)
SELECT UUID(), CURRENT_TIMESTAMP(3), h.`ownerId`, h.`id`, 'OWNER'
FROM `Household` h
LEFT JOIN `HouseholdMembership` hm
  ON hm.`userId` = h.`ownerId` AND hm.`householdId` = h.`id`
WHERE h.`ownerId` IS NOT NULL AND hm.`id` IS NULL;

-- Now it's safe to drop the ownerId from Household
-- AlterTable
ALTER TABLE `Household` DROP COLUMN `ownerId`;

-- AlterTable
ALTER TABLE `Token` ADD COLUMN `content` JSON NULL,
    MODIFY `type` ENUM('RESET_PASSWORD', 'INVITATION', 'INVITATION_HOUSEHOLD') NOT NULL;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Counterparty` ADD CONSTRAINT `Counterparty_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HouseholdMembership` ADD CONSTRAINT `HouseholdMembership_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportJob` ADD CONSTRAINT `ImportJob_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
