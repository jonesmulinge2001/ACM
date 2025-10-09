-- CreateIndex
CREATE INDEX "Profile_skills_idx" ON "Profile" USING GIN ("skills");

-- CreateIndex
CREATE INDEX "Profile_interests_idx" ON "Profile" USING GIN ("interests");

-- CreateIndex
CREATE INDEX "Profile_institution_idx" ON "Profile"("institution");

-- CreateIndex
CREATE INDEX "Profile_course_idx" ON "Profile"("course");

-- CreateIndex
CREATE INDEX "Profile_academicLevel_idx" ON "Profile"("academicLevel");
