package com.example.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

data class BackupData(
    val classes: List<SubjectClass> = emptyList(),
    val grades: List<CourseGrade> = emptyList(),
    val profileName: String? = null,
    val profilePhotoUrl: String? = null,
    val updatedAt: Long = 0L
)

class FirebaseSyncManager {
    val auth: FirebaseAuth get() = FirebaseAuth.getInstance()
    val firestore: FirebaseFirestore get() = FirebaseFirestore.getInstance()

    val currentUserEmail: String? get() = auth.currentUser?.email
    val isUserLoggedIn: Boolean get() = auth.currentUser != null

    private fun getSafeString(doc: com.google.firebase.firestore.DocumentSnapshot, field: String): String {
        return doc.get(field)?.toString() ?: ""
    }

    // uploadBackup is a no-op to ensure read-only access from the mobile app
    fun uploadBackup(
        classes: List<SubjectClass>,
        grades: List<CourseGrade>,
        onSuccess: () -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        onSuccess()
    }

    private fun getPointsForGrade(grade: String): Int {
        return when (grade.uppercase()) {
            "S" -> 10
            "A" -> 9
            "B" -> 8
            "C" -> 7
            "D" -> 6
            "E" -> 5
            else -> 0
        }
    }

    fun downloadBackup(
        onSuccess: (BackupData) -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        val user = auth.currentUser
        if (user == null) {
            onFailure(Exception("User not authenticated with Firebase."))
            return
        }

        val uid = user.uid

        // Web app collections are at root level, filtered by user_id
        val semestersTask = firestore.collection("semesters").whereEqualTo("user_id", uid).get()
        val subjectsTask = firestore.collection("subjects").whereEqualTo("user_id", uid).get()
        val basicTimetableTask = firestore.collection("timetable_entries").whereEqualTo("user_id", uid).get()
        val smartTimetableTask = firestore.collection("smart_timetable_entries").whereEqualTo("user_id", uid).get()

        com.google.android.gms.tasks.Tasks.whenAllComplete(semestersTask, subjectsTask, basicTimetableTask, smartTimetableTask)
            .addOnCompleteListener { task ->
                if (!task.isSuccessful) {
                    onFailure(task.exception ?: Exception("Failed to fetch data from Firestore"))
                    return@addOnCompleteListener
                }

                try {
                    val classesList = mutableListOf<SubjectClass>()
                    val colors = listOf(
                        0xFF3B82F6.toInt(), // Blue
                        0xFF10B981.toInt(), // Green
                        0xFFEF4444.toInt(), // Red
                        0xFFF59E0B.toInt(), // Yellow
                        0xFF8B5CF6.toInt(), // Purple
                        0xFFEC4899.toInt()  // Pink
                    )

                    fun getDynamicColor(subjectName: String): Int {
                        val idx = Math.abs(subjectName.hashCode()) % colors.size
                        return colors[idx]
                    }

                    // Map timetable_entries (basic)
                    val basicSnap = basicTimetableTask.result
                    if (basicSnap != null) {
                        for (doc in basicSnap.documents) {
                            val subjectName = getSafeString(doc, "subject_name")
                            val subjectCode = getSafeString(doc, "subject_code")
                            val day = getSafeString(doc, "day")
                            val startTime = getSafeString(doc, "start_time")
                            val endTime = getSafeString(doc, "end_time")
                            val room = getSafeString(doc, "room_number")
                            val slotCode = getSafeString(doc, "slot_code")
                            val slotLabel = getSafeString(doc, "slot_label")
                            val slot = if (slotCode.isNotEmpty()) slotCode else slotLabel
                            val type = getSafeString(doc, "type").ifEmpty { "theory" }

                            classesList.add(
                                SubjectClass(
                                    subjectName = subjectName,
                                    subjectCode = subjectCode,
                                    dayOfWeek = day,
                                    startTime = startTime,
                                    endTime = endTime,
                                    room = room,
                                    professor = "",
                                    slot = slot,
                                    type = type,
                                    colorArgb = getDynamicColor(subjectName)
                                )
                            )
                        }
                    }

                    // Map smart_timetable_entries (smart)
                    val smartSnap = smartTimetableTask.result
                    if (smartSnap != null) {
                        for (doc in smartSnap.documents) {
                            val subjectName = getSafeString(doc, "subject_name")
                            val subjectCode = getSafeString(doc, "subject_code")
                            val day = getSafeString(doc, "day")
                            val startTime = getSafeString(doc, "start_time")
                            val endTime = getSafeString(doc, "end_time")
                            val room = getSafeString(doc, "room_number")
                            val slotCode = getSafeString(doc, "slot_code")
                            val slotLabel = getSafeString(doc, "slot_label")
                            val slot = if (slotCode.isNotEmpty()) slotCode else slotLabel
                            val type = getSafeString(doc, "type").ifEmpty { "theory" }

                            classesList.add(
                                SubjectClass(
                                    subjectName = subjectName,
                                    subjectCode = subjectCode,
                                    dayOfWeek = day,
                                    startTime = startTime,
                                    endTime = endTime,
                                    room = room,
                                    professor = "",
                                    slot = slot,
                                    type = type,
                                    colorArgb = getDynamicColor(subjectName)
                                )
                            )
                        }
                    }

                    // Map semesters and subjects to course_grades
                    class SemDoc(
                        val id: String,
                        val year: Int,
                        val term: String
                    )

                    val semestersList = mutableListOf<SemDoc>()
                    val semestersSnap = semestersTask.result
                    if (semestersSnap != null) {
                        for (doc in semestersSnap.documents) {
                            val id = doc.id
                            val yearVal = doc.get("year")
                            val year = when (yearVal) {
                                is Number -> yearVal.toInt()
                                is String -> yearVal.toIntOrNull() ?: 0
                                else -> 0
                            }
                            val term = getSafeString(doc, "term")
                            semestersList.add(SemDoc(id, year, term))
                        }
                    }

                    // Sort semesters chronologically ascending (by year, then term where Fall comes before Winter)
                    val termOrder = mapOf("Fall" to 0, "Winter" to 1)
                    val sortedSemesters = semestersList.sortedWith(
                        compareBy<SemDoc> { it.year }
                            .thenBy { termOrder[it.term] ?: 2 }
                    )

                    // Map semester ID to chronological semester number (1-based index)
                    val semesterIdToNumber = sortedSemesters.mapIndexed { idx, semDoc ->
                        semDoc.id to (idx + 1)
                    }.toMap()

                    val gradesList = mutableListOf<CourseGrade>()
                    val subjectsSnap = subjectsTask.result
                    if (subjectsSnap != null) {
                        for (doc in subjectsSnap.documents) {
                            val semesterId = getSafeString(doc, "semester_id")
                            val semNumber = semesterIdToNumber[semesterId] ?: 1
                            val subjectName = getSafeString(doc, "subject_name")
                            val subjectCode = getSafeString(doc, "subject_code")
                            val creditVal = doc.get("credit")
                            val credit = when (creditVal) {
                                is Number -> creditVal.toDouble()
                                is String -> creditVal.toDoubleOrNull() ?: 0.0
                                else -> 0.0
                            }
                            val grade = getSafeString(doc, "grade").ifEmpty { "S" }
                            val gradePoints = getPointsForGrade(grade)

                            gradesList.add(
                                CourseGrade(
                                    semester = semNumber,
                                    courseCode = subjectCode,
                                    courseName = subjectName,
                                    credits = credit,
                                    grade = grade,
                                    gradePoints = gradePoints
                                )
                            )
                        }
                    }

                    val distinctClasses = classesList.distinctBy {
                        "${it.dayOfWeek.lowercase()}_${it.slot.lowercase()}_${it.subjectName.lowercase()}"
                    }
                    val distinctGrades = gradesList.distinctBy {
                        "${it.semester}_${it.courseCode.lowercase()}"
                    }

                    val profileName = user.displayName ?: user.email?.substringBefore("@")?.replaceFirstChar { it.uppercase() } ?: "Scholar"
                    val profilePhotoUrl = user.photoUrl?.toString()

                    onSuccess(
                        BackupData(
                            classes = distinctClasses,
                            grades = distinctGrades,
                            profileName = profileName,
                            profilePhotoUrl = profilePhotoUrl,
                            updatedAt = System.currentTimeMillis()
                        )
                    )

                } catch (e: Exception) {
                    onFailure(e)
                }
            }
    }
}

