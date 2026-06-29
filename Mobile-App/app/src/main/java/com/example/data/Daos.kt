package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AcademicDao {
    // Timetable / Classes
    @Query("SELECT * FROM subject_classes ORDER BY startTime ASC")
    fun getAllClasses(): Flow<List<SubjectClass>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertClass(subjectClass: SubjectClass)

    @Update
    suspend fun updateClass(subjectClass: SubjectClass)

    @Query("DELETE FROM subject_classes WHERE id = :id")
    suspend fun deleteClassById(id: Int)

    // Course Grades (CGPA)
    @Query("SELECT * FROM course_grades ORDER BY semester ASC, courseCode ASC")
    fun getAllGrades(): Flow<List<CourseGrade>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGrade(courseGrade: CourseGrade)

    @Update
    suspend fun updateGrade(courseGrade: CourseGrade)

    @Query("DELETE FROM course_grades WHERE id = :id")
    suspend fun deleteGradeById(id: Int)

    // Clear All Tables
    @Query("DELETE FROM subject_classes")
    suspend fun deleteAllClasses()

    @Query("DELETE FROM course_grades")
    suspend fun deleteAllGrades()
}
