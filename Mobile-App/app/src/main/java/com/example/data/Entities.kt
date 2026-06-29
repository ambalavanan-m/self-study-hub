package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "subject_classes")
data class SubjectClass(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val subjectName: String,
    val subjectCode: String = "", // Mapped from webapp
    val dayOfWeek: String, // e.g. "Monday", "Tuesday", etc.
    val startTime: String,  // e.g. "09:00"
    val endTime: String,    // e.g. "10:00"
    val room: String,
    val professor: String,
    val colorArgb: Int,     // Custom card color representation
    val slot: String = "",  // e.g. "A1", "L1", "TA2"
    val type: String = "theory" // "theory" or "lab"
)

@Entity(tableName = "course_grades")
data class CourseGrade(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val semester: Int,     // e.g. 1, 2, 3, etc.
    val courseCode: String,
    val courseName: String,
    val credits: Double,   // Changed to Double to match webapp
    val grade: String,     // e.g. "S", "A", "B", "C", "D", "E", "P", "A_ABSENT"
    val gradePoints: Int   // Mapped to S=10, A=9, B=8, C=7, D=6, E=5, others=0
)

