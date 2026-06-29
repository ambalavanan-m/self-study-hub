package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class AcademicViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: AcademicRepository
    val syncManager = FirebaseSyncManager()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = AcademicRepository(database.academicDao())
        
        // One-time clear of previous demo timetable classes to respect user's request
        val prefs = application.getSharedPreferences("academic_app_prefs", android.content.Context.MODE_PRIVATE)
        val clearedDemo = prefs.getBoolean("timetable_demo_cleared_v4", false)
        
        viewModelScope.launch {
            try {
                if (!clearedDemo) {
                    repository.clearAllClasses()
                    repository.clearAllGrades()
                    prefs.edit().putBoolean("timetable_demo_cleared_v4", true).apply()
                }
                if (repository.allClasses.first().isEmpty() && repository.allGrades.first().isEmpty()) {
                    preloadSampleData()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // --- Database Flows ---
    val classes: StateFlow<List<SubjectClass>> = repository.allClasses
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val grades: StateFlow<List<CourseGrade>> = repository.allGrades
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Helper function for GPA/CGPA calculations (matching webapp's cgpa.ts exactly) ---
    private fun calculateGPA(gradesList: List<CourseGrade>): Double {
        val gradePointsMap = mapOf(
            "S" to 10,
            "A" to 9,
            "B" to 8,
            "C" to 7,
            "D" to 6,
            "E" to 5
        )
        var totalPoints = 0.0
        var totalCredits = 0.0
        for (grade in gradesList) {
            val g = grade.grade.uppercase()
            if (g != "P" && g != "A_ABSENT") {
                val points = gradePointsMap[g]
                if (points != null) {
                    totalPoints += points * grade.credits
                    totalCredits += grade.credits
                }
            }
        }
        if (totalCredits == 0.0) return 0.0
        val gpa = totalPoints / totalCredits
        return Math.round(gpa * 100.0) / 100.0
    }

    // --- Academic Profile Stats & CGPA ---
    val overallCgpa: StateFlow<Double> = grades.map { gradeList ->
        calculateGPA(gradeList)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val totalCredits: StateFlow<Double> = grades.map { gradeList ->
        gradeList.filter { it.grade.uppercase() != "A_ABSENT" }.sumOf { it.credits }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val semesterGpas: StateFlow<Map<Int, Double>> = grades.map { gradeList ->
        gradeList.groupBy { it.semester }.mapValues { (_, semesterGrades) ->
            calculateGPA(semesterGrades)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    // --- Database Operations ---

    // Classes
    fun addClass(subjectClass: SubjectClass) = viewModelScope.launch {
        repository.insertClass(subjectClass)
    }

    fun updateClass(subjectClass: SubjectClass) = viewModelScope.launch {
        repository.updateClass(subjectClass)
    }

    fun deleteClass(id: Int) = viewModelScope.launch {
        repository.deleteClassById(id)
    }

    // Grades
    fun addGrade(grade: CourseGrade) = viewModelScope.launch {
        repository.insertGrade(grade)
    }

    fun updateGrade(grade: CourseGrade) = viewModelScope.launch {
        repository.updateGrade(grade)
    }

    fun deleteGrade(id: Int) = viewModelScope.launch {
        repository.deleteGradeById(id)
    }

    // --- Firebase Synchronization ---
    // uploadToFirebase is disabled/no-op in read-only mode
    fun uploadToFirebase(onSuccess: () -> Unit, onFailure: (Exception) -> Unit) {
        onSuccess()
    }

    fun downloadFromFirebase(onSuccess: (BackupData) -> Unit, onFailure: (Exception) -> Unit) {
        viewModelScope.launch {
            syncManager.downloadBackup(
                onSuccess = { backupData ->
                    viewModelScope.launch {
                        try {
                            repository.clearAllClasses()
                            repository.clearAllGrades()

                            backupData.classes.forEach { repository.insertClass(it) }
                            backupData.grades.forEach { repository.insertGrade(it) }

                            onSuccess(backupData)
                        } catch (e: Exception) {
                            onFailure(e)
                        }
                    }
                },
                onFailure = onFailure
            )
        }
    }

    private suspend fun preloadSampleData() {
        // Sample data preloading disabled as requested to keep the grades tab clean on start
    }
}
