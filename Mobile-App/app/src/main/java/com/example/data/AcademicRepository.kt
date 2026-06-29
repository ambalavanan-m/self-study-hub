package com.example.data

import kotlinx.coroutines.flow.Flow

class AcademicRepository(private val dao: AcademicDao) {
    // Classes
    val allClasses: Flow<List<SubjectClass>> = dao.getAllClasses()
    suspend fun insertClass(subjectClass: SubjectClass) = dao.insertClass(subjectClass)
    suspend fun updateClass(subjectClass: SubjectClass) = dao.updateClass(subjectClass)
    suspend fun deleteClassById(id: Int) = dao.deleteClassById(id)
    suspend fun clearAllClasses() = dao.deleteAllClasses()

    // Grades
    val allGrades: Flow<List<CourseGrade>> = dao.getAllGrades()
    suspend fun insertGrade(courseGrade: CourseGrade) = dao.insertGrade(courseGrade)
    suspend fun updateGrade(courseGrade: CourseGrade) = dao.updateGrade(courseGrade)
    suspend fun deleteGradeById(id: Int) = dao.deleteGradeById(id)
    suspend fun clearAllGrades() = dao.deleteAllGrades()

    // Clear and restore
    suspend fun clearAllData() {
        dao.deleteAllClasses()
        dao.deleteAllGrades()
    }
}
