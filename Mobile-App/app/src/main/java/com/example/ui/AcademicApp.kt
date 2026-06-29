package com.example.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.*
import java.text.SimpleDateFormat
import java.util.*

fun formatTimeTo12Hour(timeStr: String): String {
    return try {
        val parts = timeStr.split(":")
        if (parts.size >= 2) {
            val hour = parts[0].trim().toInt()
            val minute = parts[1].trim().toInt()
            val ampm = if (hour >= 12) "PM" else "AM"
            val hour12 = when {
                hour == 0 -> 12
                hour > 12 -> hour - 12
                else -> hour
            }
            String.format(Locale.getDefault(), "%d:%02d %s", hour12, minute, ampm)
        } else {
            timeStr
        }
    } catch (e: Exception) {
        timeStr
    }
}

fun isClassOngoing(startTimeStr: String, endTimeStr: String): Boolean {
    try {
        val now = Calendar.getInstance()
        val currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

        val startParts = startTimeStr.split(":")
        if (startParts.size < 2) return false
        val startHour = startParts[0].toIntOrNull() ?: return false
        val startMinute = startParts[1].toIntOrNull() ?: return false
        val startMinutes = startHour * 60 + startMinute

        val endParts = endTimeStr.split(":")
        if (endParts.size < 2) return false
        val endHour = endParts[0].toIntOrNull() ?: return false
        val endMinute = endParts[1].toIntOrNull() ?: return false
        val endMinutes = endHour * 60 + endMinute

        return currentMinutes in startMinutes..endMinutes
    } catch (e: Exception) {
        return false
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AcademicApp(viewModel: AcademicViewModel) {
    val classes by viewModel.classes.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current
    LaunchedEffect(classes) {
        com.example.data.NotificationScheduler.scheduleClassNotifications(context, classes)
    }

    var userSession by remember { mutableStateOf<String?>(if (viewModel.syncManager.isUserLoggedIn) "logged_in" else "login") }
    val firebaseUser = viewModel.syncManager.auth.currentUser
    var username by remember {
        mutableStateOf(
            firebaseUser?.displayName ?: firebaseUser?.email?.substringBefore("@")?.replaceFirstChar { it.uppercase() } ?: "Scholar"
        )
    }
    var avatarPic by remember {
        mutableStateOf(
            firebaseUser?.photoUrl?.toString() ?: "Default"
        )
    }

    LaunchedEffect(userSession) {
        if (userSession == "logged_in" && viewModel.syncManager.isUserLoggedIn) {
            val uUser = viewModel.syncManager.auth.currentUser
            uUser?.let {
                username = it.displayName ?: it.email?.substringBefore("@")?.replaceFirstChar { it.uppercase() } ?: "Scholar"
                avatarPic = it.photoUrl?.toString() ?: "Default"
            }
            viewModel.downloadFromFirebase(
                onSuccess = { backupData ->
                    backupData.profileName?.let { username = it }
                    backupData.profilePhotoUrl?.let { avatarPic = it }
                },
                onFailure = {}
            )
        }
    }

    Crossfade(targetState = userSession, label = "session_fade") { session ->
        when (session) {
            "logged_in" -> {
                var currentTab by remember { mutableStateOf(0) }
                val tabs = listOf(
                    TabItem("Home", Icons.Default.Dashboard, Icons.Outlined.Dashboard),
                    TabItem("Grades", Icons.Default.School, Icons.Outlined.School),
                    TabItem("Timetable", Icons.Default.CalendarToday, Icons.Outlined.CalendarToday),
                    TabItem("Grid", Icons.Default.Apps, Icons.Outlined.Apps),
                    TabItem("Profile", Icons.Default.Person, Icons.Outlined.Person)
                )

                val isDark = isSystemInDarkTheme()
                val containerBg = MaterialTheme.colorScheme.background
                val pillBg = if (isDark) Color(0xFF1A1A1C) else Color(0xFFFFFFFF)
                val selectedTabBg = if (isDark) Color(0xFF38383A) else Color(0xFFF1F5F9)
                val selectedTabIconTint = if (isDark) Color.White else Color(0xFF0F172A)
                val unselectedTabIconTint = if (isDark) Color.White.copy(alpha = 0.5f) else Color(0xFF94A3B8)

                Scaffold(
                    bottomBar = {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(containerBg)
                                .navigationBarsPadding()
                                .padding(horizontal = 24.dp, vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                modifier = Modifier
                                    .shadow(elevation = 12.dp, shape = RoundedCornerShape(32.dp))
                                    .background(pillBg, RoundedCornerShape(32.dp))
                                    .border(
                                        width = 1.dp,
                                        color = if (isDark) Color.Transparent else Color(0xFFE2E8F0),
                                        shape = RoundedCornerShape(32.dp)
                                    )
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                                    .fillMaxWidth()
                                    .testTag("bottom_nav"),
                                horizontalArrangement = Arrangement.SpaceAround,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                tabs.forEachIndexed { index, tab ->
                                    val isSelected = currentTab == index
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(if (isSelected) selectedTabBg else Color.Transparent)
                                            .clickable { currentTab = index }
                                            .padding(horizontal = 20.dp, vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Box {
                                            Icon(
                                                imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                                                contentDescription = tab.title,
                                                tint = if (isSelected) selectedTabIconTint else unselectedTabIconTint,
                                                modifier = Modifier.size(24.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentTab) {
                            0 -> DashboardScreen(
                                viewModel = viewModel,
                                onNavigateToTab = { currentTab = it },
                                username = username,
                                onOpenProfile = { currentTab = 4 }
                            )
                            1 -> GradesScreen(viewModel)
                            2 -> ScheduleScreen(viewModel)
                            3 -> {
                                val classes by viewModel.classes.collectAsState()
                                var selectedClassForDetail by remember { mutableStateOf<SubjectClass?>(null) }
                                
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                ) {
                                    WeeklyGridScreen(
                                        classes = classes,
                                        onAddClassAtSlot = { _, _, _ -> },
                                        onClassClick = { cls ->
                                            selectedClassForDetail = cls
                                        }
                                    )
                                }

                                if (selectedClassForDetail != null) {
                                    ClassDetailDialog(
                                        subjectClass = selectedClassForDetail!!,
                                        onDismiss = { selectedClassForDetail = null }
                                    )
                                }
                            }
                            4 -> {
                                val classes by viewModel.classes.collectAsState()
                                val cgpa by viewModel.overallCgpa.collectAsState()
                                
                                ProfileScreen(
                                    viewModel = viewModel,
                                    currentName = username,
                                    avatarUrl = avatarPic,
                                    classesCount = classes.size,
                                    cgpa = cgpa,
                                    onUpdateProfile = { newName, newAvatar ->
                                        username = newName
                                        avatarPic = newAvatar
                                    },
                                    onSignOut = {
                                        userSession = "login"
                                        username = "Scholar"
                                    },
                                    onDismiss = null
                                )
                            }
                        }
                    }
                }
            }
            "landing" -> {
                LandingScreen(
                    onNavigateToLogin = { userSession = "login" },
                    onNavigateToSignup = { userSession = "signup" },
                    onExploreAsGuest = { userSession = "logged_in" }
                )
            }
            "login" -> {
                LoginScreen(
                    onLoginSuccess = { emailName ->
                        userSession = "logged_in"
                        username = emailName.replaceFirstChar { it.uppercase() }
                    },
                    onBackToLanding = { userSession = "login" },
                    onGoToSignup = { userSession = "signup" }
                )
            }
            "signup" -> {
                SignupScreen(
                    onSignupSuccess = { emailName ->
                        userSession = "logged_in"
                        username = emailName.replaceFirstChar { it.uppercase() }
                    },
                    onBackToLanding = { userSession = "login" },
                    onGoToLogin = { userSession = "login" }
                )
            }
            else -> {
                userSession = "logged_in"
            }
        }
    }
}

data class TabItem(
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

// ==========================================
// 1. DASHBOARD SCREEN
// ==========================================
@Composable
fun DashboardScreen(
    viewModel: AcademicViewModel,
    onNavigateToTab: (Int) -> Unit,
    username: String,
    onOpenProfile: () -> Unit
) {
    val classes by viewModel.classes.collectAsState()
    val cgpa by viewModel.overallCgpa.collectAsState()
    val credits by viewModel.totalCredits.collectAsState()

    var currentTime by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(1000)
            currentTime = System.currentTimeMillis()
        }
    }

    val currentHour = Calendar.getInstance().apply { timeInMillis = currentTime }.get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        currentHour < 12 -> "Good Morning"
        currentHour < 17 -> "Good Afternoon"
        else -> "Good Evening"
    }

    val todayName = SimpleDateFormat("EEEE", Locale.getDefault()).format(Date(currentTime))
    val todayClasses = classes.filter { it.dayOfWeek.equals(todayName, ignoreCase = true) }
    val sortedTodayClasses = todayClasses.sortedWith(
        compareByDescending<SubjectClass> { isClassOngoing(it.startTime, it.endTime) }
            .thenBy { it.startTime }
    )

    val formattedCredits = if (credits % 1.0 == 0.0) credits.toInt().toString() else credits.toString()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- Top Bar with Profile ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "StudyTrack",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Self Study Hub",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Live Clock Display
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = SimpleDateFormat("hh:mm:ss a", Locale.getDefault()).format(Date(currentTime)),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                IconButton(
                    onClick = onOpenProfile,
                    modifier = Modifier.testTag("profile_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Profile Settings",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }

        // --- Header / Greeting ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(4.dp, RoundedCornerShape(16.dp)),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Text(
                    text = "$greeting, $username! 👋",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Welcome back to your Self Study Hub. Let's make today productive!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                )
            }
        }

        // --- Academic Stats (CGPA & Credits) ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToTab(1) } // Index 1 is Grades/CGPA
                    .shadow(2.dp, RoundedCornerShape(16.dp)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.School,
                        contentDescription = "CGPA Icon",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = String.format(Locale.getDefault(), "%.2f", cgpa),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Current CGPA",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }

            Card(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onNavigateToTab(2) } // Index 2 is Timetable List
                    .shadow(2.dp, RoundedCornerShape(16.dp)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Stars,
                        contentDescription = "Credits Icon",
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = formattedCredits,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Total Credits",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }


        // --- Today's Classes Summary ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(2.dp, RoundedCornerShape(16.dp)),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Today's Schedule ($todayName)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    TextButton(onClick = { onNavigateToTab(2) }) { // Index 2 is Timetable List
                        Text("View All")
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                if (todayClasses.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Weekend,
                            contentDescription = "No classes icon",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No classes scheduled today!",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "A perfect opportunity for self-study and deep focus.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            textAlign = TextAlign.Center
                        )
                    }
                } else {
                    sortedTodayClasses.forEachIndexed { idx, cls ->
                        val ongoing = isClassOngoing(cls.startTime, cls.endTime)
                        val rowModifier = if (ongoing) {
                            Modifier
                                .fillMaxWidth()
                                .background(
                                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .border(
                                    width = 1.dp,
                                    color = MaterialTheme.colorScheme.primary,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .padding(horizontal = 12.dp, vertical = 10.dp)
                        } else {
                            Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        }
                        Row(
                            modifier = rowModifier,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .background(Color(cls.colorArgb), CircleShape)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = if (cls.subjectCode.isNotEmpty()) "${cls.subjectName} (${cls.subjectCode})" else cls.subjectName,
                                        fontWeight = if (ongoing) FontWeight.Bold else FontWeight.SemiBold,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (ongoing) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                                        modifier = Modifier.weight(1f, fill = false)
                                    )
                                    if (ongoing) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primary,
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "ONGOING",
                                                color = MaterialTheme.colorScheme.onPrimary,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = "${formatTimeTo12Hour(cls.startTime)} - ${formatTimeTo12Hour(cls.endTime)} | Room ${cls.room}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        if (idx < sortedTodayClasses.lastIndex) {
                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 2. TIMETABLE SCREEN
// ==========================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(viewModel: AcademicViewModel) {
    val classes by viewModel.classes.collectAsState()
    val days = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
    var selectedDay by remember { mutableStateOf(SimpleDateFormat("EEEE", Locale.getDefault()).format(Date())) }
    if (!days.contains(selectedDay)) {
        selectedDay = "Monday"
    }

    var selectedClassForDetail by remember { mutableStateOf<SubjectClass?>(null) }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Header Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Daily Class Schedule",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (viewModel.syncManager.isUserLoggedIn) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Cloud,
                                contentDescription = "Synced",
                                tint = MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                text = "Synced with study-hub-007 Cloud",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                if (viewModel.syncManager.isUserLoggedIn) {
                    val context = LocalContext.current
                    var isSyncing by remember { mutableStateOf(false) }
                    IconButton(
                        onClick = {
                            isSyncing = true
                            viewModel.downloadFromFirebase(
                                onSuccess = {
                                    isSyncing = false
                                    android.widget.Toast.makeText(context, "Schedule synced with Firebase!", android.widget.Toast.LENGTH_SHORT).show()
                                },
                                onFailure = {
                                    isSyncing = false
                                    android.widget.Toast.makeText(context, "Sync failed: ${it.message}", android.widget.Toast.LENGTH_SHORT).show()
                                }
                            )
                        },
                        enabled = !isSyncing
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Icon(
                                imageVector = Icons.Default.Sync,
                                contentDescription = "Sync Schedule",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            // Horizontal Day Selector
            ScrollableTabRow(
                selectedTabIndex = days.indexOf(selectedDay),
                modifier = Modifier.fillMaxWidth(),
                edgePadding = 16.dp
            ) {
                days.forEach { day ->
                    Tab(
                        selected = selectedDay == day,
                        onClick = { selectedDay = day },
                        text = { Text(day.take(3), fontWeight = FontWeight.Bold) }
                    )
                }
            }

            val dayClasses = classes.filter { it.dayOfWeek.equals(selectedDay, ignoreCase = true) }

            if (dayClasses.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.EventNote,
                            contentDescription = "Empty Schedule",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No classes scheduled for $selectedDay",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "To schedule classes or make changes, update your timetable grid directly on the online website dashboard.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(dayClasses, key = { it.id }) { cls ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedClassForDetail = cls }
                                .shadow(2.dp, RoundedCornerShape(12.dp)),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(IntrinsicSize.Min)
                            ) {
                                // Left vertical accent color bar
                                Box(
                                    modifier = Modifier
                                        .width(6.dp)
                                        .fillMaxHeight()
                                        .background(Color(cls.colorArgb))
                                )
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        text = if (cls.subjectCode.isNotEmpty()) "${cls.subjectName} (${cls.subjectCode})" else cls.subjectName,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                imageVector = Icons.Default.AccessTime,
                                                contentDescription = "Time",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "${formatTimeTo12Hour(cls.startTime)} - ${formatTimeTo12Hour(cls.endTime)}",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                imageVector = Icons.Default.Place,
                                                contentDescription = "Room",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Room ${cls.room}",
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                    if (cls.slot.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Slot: ${cls.slot.uppercase()} (${cls.type.uppercase()})",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(cls.colorArgb)
                                        )
                                    }
                                    if (cls.professor.isNotEmpty()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "Prof: ${cls.professor}",
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (selectedClassForDetail != null) {
        ClassDetailDialog(
            subjectClass = selectedClassForDetail!!,
            onDismiss = { selectedClassForDetail = null }
        )
    }


}

@Composable
fun ClassDetailDialog(
    subjectClass: SubjectClass,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (subjectClass.subjectCode.isNotEmpty()) "${subjectClass.subjectName} (${subjectClass.subjectCode})" else subjectClass.subjectName,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.titleLarge
            )
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Today, contentDescription = "Day", tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Day: ${subjectClass.dayOfWeek}", fontWeight = FontWeight.Medium)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AccessTime, contentDescription = "Time", tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Time: ${formatTimeTo12Hour(subjectClass.startTime)} - ${formatTimeTo12Hour(subjectClass.endTime)}", fontWeight = FontWeight.Medium)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Place, contentDescription = "Location", tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Location: Room ${subjectClass.room}", fontWeight = FontWeight.Medium)
                }
                if (subjectClass.subjectCode.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Code, contentDescription = "Subject Code", tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Subject Code: ${subjectClass.subjectCode}", fontWeight = FontWeight.Medium)
                    }
                }
                if (subjectClass.slot.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Bookmark, contentDescription = "Slot", tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Slot: ${subjectClass.slot.uppercase()} (${subjectClass.type.uppercase()})", fontWeight = FontWeight.Medium)
                    }
                }
                if (subjectClass.professor.isNotEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Person, contentDescription = "Professor", tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Instructor: ${subjectClass.professor}", fontWeight = FontWeight.Medium)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddClassDialog(
    defaultDay: String,
    presetSlot: String = "",
    presetType: String = "theory",
    onDismiss: () -> Unit,
    onSave: (SubjectClass) -> Unit
) {
    var subjectName by remember { mutableStateOf("") }
    var subjectCode by remember { mutableStateOf("") }
    var dayOfWeek by remember { mutableStateOf(defaultDay) }
    var slot by remember { mutableStateOf(presetSlot) }
    var type by remember { mutableStateOf(presetType) }

    val defaultStartTime = remember(presetSlot, type) {
        if (presetSlot.isNotEmpty()) {
            if (type == "theory") {
                when {
                    presetSlot in listOf("A1", "B1", "C1", "D1", "E1") -> {
                        val idx = listOf("A1", "B1", "C1", "D1", "E1").indexOf(presetSlot)
                        "${8 + idx}:00".padStart(5, '0')
                    }
                    presetSlot in listOf("A2", "B2", "C2", "D2", "E2") -> {
                        val idx = listOf("A2", "B2", "C2", "D2", "E2").indexOf(presetSlot)
                        "${14 + idx}:00"
                    }
                    else -> "09:00"
                }
            } else {
                when (presetSlot) {
                    "L1" -> "08:00"
                    "L2" -> "08:51"
                    "L3" -> "09:51"
                    "L4" -> "10:41"
                    "L5" -> "11:40"
                    "L6" -> "12:31"
                    "L31" -> "14:00"
                    "L32" -> "14:51"
                    "L33" -> "15:51"
                    "L34" -> "16:41"
                    "L35" -> "17:40"
                    "L36" -> "18:31"
                    else -> "08:00"
                }
            }
        } else "09:00"
    }

    val defaultEndTime = remember(presetSlot, type) {
        if (presetSlot.isNotEmpty()) {
            if (type == "theory") {
                when {
                    presetSlot in listOf("A1", "B1", "C1", "D1", "E1") -> {
                        val idx = listOf("A1", "B1", "C1", "D1", "E1").indexOf(presetSlot)
                        "${8 + idx}:50".padStart(5, '0')
                    }
                    presetSlot in listOf("A2", "B2", "C2", "D2", "E2") -> {
                        val idx = listOf("A2", "B2", "C2", "D2", "E2").indexOf(presetSlot)
                        "${14 + idx}:50"
                    }
                    else -> "09:50"
                }
            } else {
                when (presetSlot) {
                    "L1" -> "08:50"
                    "L2" -> "09:40"
                    "L3" -> "10:40"
                    "L4" -> "11:30"
                    "L5" -> "12:30"
                    "L6" -> "13:20"
                    "L31" -> "14:50"
                    "L32" -> "15:40"
                    "L33" -> "16:40"
                    "L34" -> "17:30"
                    "L35" -> "18:30"
                    "L36" -> "19:20"
                    else -> "08:50"
                }
            }
        } else "10:00"
    }

    var startTime by remember { mutableStateOf(defaultStartTime) }
    var endTime by remember { mutableStateOf(defaultEndTime) }
    var room by remember { mutableStateOf("") }
    var professor by remember { mutableStateOf("") }

    val colors = listOf(
        Color(0xFF3B82F6), // Blue
        Color(0xFF10B981), // Green
        Color(0xFFEF4444), // Red
        Color(0xFFF59E0B), // Yellow
        Color(0xFF8B5CF6), // Purple
        Color(0xFFEC4899)  // Pink
    )
    var selectedColor by remember { mutableStateOf(colors[0]) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Class Schedule", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = subjectName,
                    onValueChange = { subjectName = it },
                    label = { Text("Course Name") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("class_name_input"),
                    singleLine = true
                )

                OutlinedTextField(
                    value = subjectCode,
                    onValueChange = { subjectCode = it },
                    label = { Text("Course Code (e.g. CSE202)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = dayOfWeek,
                    onValueChange = { dayOfWeek = it },
                    label = { Text("Day of Week (e.g. Monday)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = slot,
                        onValueChange = { slot = it },
                        label = { Text("Slot (e.g. A1, L1)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Class Type", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            listOf("theory", "lab").forEach { opt ->
                                val isSelected = type == opt
                                FilterChip(
                                    selected = isSelected,
                                    onClick = { type = opt },
                                    label = { Text(opt.uppercase(), fontSize = 10.sp) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = startTime,
                        onValueChange = { startTime = it },
                        label = { Text("Start Time") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = endTime,
                        onValueChange = { endTime = it },
                        label = { Text("End Time") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = room,
                    onValueChange = { room = it },
                    label = { Text("Room / Location") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = professor,
                    onValueChange = { professor = it },
                    label = { Text("Instructor / Professor") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // Color Picker
                Text("Accent Color", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(colors) { color ->
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(color)
                                .clickable { selectedColor = color }
                                .padding(2.dp)
                        ) {
                            if (selectedColor == color) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.5f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Selected",
                                        tint = Color.Black,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (subjectName.isNotEmpty()) {
                        onSave(
                            SubjectClass(
                                subjectName = subjectName,
                                subjectCode = subjectCode,
                                dayOfWeek = dayOfWeek,
                                startTime = startTime,
                                endTime = endTime,
                                room = room,
                                professor = professor,
                                slot = slot,
                                type = type,
                                colorArgb = selectedColor.hashCode()
                            )
                        )
                    }
                },
                modifier = Modifier.testTag("save_class_button")
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun GradesScreen(viewModel: AcademicViewModel) {
    val grades by viewModel.grades.collectAsState()
    val cgpa by viewModel.overallCgpa.collectAsState()
    val totalCredits by viewModel.totalCredits.collectAsState()
    val semesterGpas by viewModel.semesterGpas.collectAsState()

    var showViewOnlyAlert by remember { mutableStateOf(false) }
    var selectedSemFilter by remember { mutableStateOf("All") }

    val semesters = listOf("All") + grades.map { it.semester.toString() }.distinct().sorted()

    val filteredGrades = if (selectedSemFilter == "All") {
        grades
    } else {
        grades.filter { it.semester == selectedSemFilter.toInt() }
    }

    val context = LocalContext.current

    if (showViewOnlyAlert) {
        AlertDialog(
            onDismissRequest = { showViewOnlyAlert = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Info",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("View-Only Mode")
                }
            },
            text = {
                Text(
                    "To ensure data integrity and prevent sync conflicts with your website, adding, updating, or deleting academic data (like courses, timetable slots, or grades) is managed directly on your online dashboard. Changes made on your website will automatically reflect here.",
                    style = MaterialTheme.typography.bodyMedium
                )
            },
            confirmButton = {
                TextButton(onClick = { showViewOnlyAlert = false }) {
                    Text("Got it")
                }
            }
        )
    }

    val formattedTotalCredits = if (totalCredits % 1.0 == 0.0) totalCredits.toInt().toString() else totalCredits.toString()

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "CGPA Manager",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Current CGPA: " + String.format(Locale.getDefault(), "%.2f", cgpa),
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    if (viewModel.syncManager.isUserLoggedIn) {
                        var isSyncing by remember { mutableStateOf(false) }
                        IconButton(
                            onClick = {
                                isSyncing = true
                                viewModel.downloadFromFirebase(
                                    onSuccess = {
                                        isSyncing = false
                                        android.widget.Toast.makeText(context, "Grades synced with Firebase!", android.widget.Toast.LENGTH_SHORT).show()
                                    },
                                    onFailure = {
                                        isSyncing = false
                                        android.widget.Toast.makeText(context, "Sync failed: ${it.message}", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                )
                            },
                            enabled = !isSyncing
                        ) {
                            if (isSyncing) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Sync,
                                    contentDescription = "Sync Grades",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF7F9FB))
                .padding(padding)
        ) {
            // Semester Filters Row
            if (semesters.size > 1) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(semesters) { sem ->
                        val selected = selectedSemFilter == sem
                        FilterChip(
                            selected = selected,
                            onClick = { selectedSemFilter = sem },
                            label = { Text(if (sem == "All") "All Semesters" else "Semester $sem") }
                        )
                    }
                }
            }

            // Copy Report button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Total Earned Credits: $formattedTotalCredits",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                TextButton(
                    onClick = {
                        val sb = StringBuilder()
                        sb.append("Academic Life Summary - Self Study Hub\n")
                        sb.append("=====================================\n")
                        sb.append("Cumulative CGPA: ").append(String.format(Locale.getDefault(), "%.2f", cgpa)).append("\n")
                        sb.append("Total Earned Credits: ").append(formattedTotalCredits).append("\n\n")
                        sb.append("Grades Log:\n")
                        grades.groupBy { it.semester }.toSortedMap().forEach { (sem, list) ->
                            sb.append("-----------------------------\n")
                            sb.append("Semester ").append(sem).append("\n")
                            list.forEach { g ->
                                val crFmt = if (g.credits % 1.0 == 0.0) g.credits.toInt().toString() else g.credits.toString()
                                sb.append(" - ").append(g.courseCode).append(": ").append(g.courseName)
                                    .append(" | Credits: ").append(crFmt).append(" | Grade: ").append(g.grade).append("\n")
                            }
                        }
                        android.widget.Toast.makeText(context, "Academic report copied!", android.widget.Toast.LENGTH_SHORT).show()
                        val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                        val clip = android.content.ClipData.newPlainText("Academic Report", sb.toString())
                        clipboard.setPrimaryClip(clip)
                    }
                ) {
                    Icon(Icons.Default.Share, contentDescription = "Share", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Copy Report", fontWeight = FontWeight.Bold)
                }
            }

            if (filteredGrades.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Grade,
                            contentDescription = "Empty",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No Grades Found",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(bottom = 32.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                ) {
                    if (selectedSemFilter == "All") {
                        // Group by academic year
                        val gradesByYear = filteredGrades.groupBy { grade ->
                            ((grade.semester - 1) / 2) + 1
                        }.toSortedMap(compareByDescending { it })

                        gradesByYear.forEach { (yearNum, yearGrades) ->
                            item(key = "year_$yearNum") {
                                AcademicYearCard(
                                    yearNum = yearNum,
                                    yearGrades = yearGrades
                                )
                            }
                        }
                    } else {
                        // Just show single semester view
                        val semInt = selectedSemFilter.toInt()
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 8.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    val semGpa = semesterGpas[semInt] ?: 0.0
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Semester $selectedSemFilter GPA: " + String.format(Locale.getDefault(), "%.2f", semGpa),
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))
                                    SemesterTable(
                                        semesterGrades = filteredGrades
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AcademicYearCard(
    yearNum: Int,
    yearGrades: List<CourseGrade>
) {
    val yearLabel = when (yearNum) {
        1 -> "First Year"
        2 -> "Second Year"
        3 -> "Third Year"
        4 -> "Fourth Year"
        else -> "$yearNum Year"
    }

    val yearDates = when (yearNum) {
        1 -> "[2024-25]"
        2 -> "[2025-26]"
        3 -> "[2026-27]"
        4 -> "[2027-28]"
        else -> ""
    }

    val gradePointsMap = mapOf(
        "S" to 10,
        "A" to 9,
        "B" to 8,
        "C" to 7,
        "D" to 6,
        "E" to 5
    )

    val gradedYearCourses = yearGrades.filter { 
        val g = it.grade.uppercase()
        g != "P" && g != "A_ABSENT" && gradePointsMap.containsKey(g)
    }
    val yearGpa = if (gradedYearCourses.isEmpty()) 0.0 else {
        val totalPoints = gradedYearCourses.sumOf { (gradePointsMap[it.grade.uppercase()] ?: 0) * it.credits }
        val totalCredits = gradedYearCourses.sumOf { it.credits }
        if (totalCredits == 0.0) 0.0 else (totalPoints / totalCredits)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Year Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = yearLabel,
                            fontWeight = FontWeight.Black,
                            style = MaterialTheme.typography.titleLarge,
                            color = Color(0xFF1E293B)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = yearDates,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFF64748B),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Year GPA: " + String.format(Locale.getDefault(), "%.2f", yearGpa),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.ExtraBold,
                    )
                }
            }

            val yearGradesBySem = yearGrades.groupBy { it.semester }.toSortedMap()

            yearGradesBySem.forEach { (semNum, semGrades) ->
                Spacer(modifier = Modifier.height(16.dp))

                val gradedSemCourses = semGrades.filter { 
                    val g = it.grade.uppercase()
                    g != "P" && g != "A_ABSENT" && gradePointsMap.containsKey(g)
                }
                val semGpa = if (gradedSemCourses.isEmpty()) 0.0 else {
                    val totalPoints = gradedSemCourses.sumOf { (gradePointsMap[it.grade.uppercase()] ?: 0) * it.credits }
                    val totalCredits = gradedSemCourses.sumOf { it.credits }
                    if (totalCredits == 0.0) 0.0 else (totalPoints / totalCredits)
                }

                val semLabel = if (semNum % 2 == 1) "Fall Semester" else "Winter Semester"

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$semLabel  GPA: " + String.format(Locale.getDefault(), "%.2f", semGpa),
                        fontWeight = FontWeight.Bold,
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))
                SemesterTable(
                    semesterGrades = semGrades
                )
            }
        }
    }
}

@Composable
fun SemesterTable(
    semesterGrades: List<CourseGrade>
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFFF8FAFC), shape = RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFFE2E8F0), shape = RoundedCornerShape(8.dp))
    ) {
        // Table Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF1F5F9))
                .padding(vertical = 8.dp, horizontal = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Subject", modifier = Modifier.weight(3.0f), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Color(0xFF475569))
            Text("Code", modifier = Modifier.weight(1.5f), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Color(0xFF475569))
            Text("Credit", modifier = Modifier.weight(0.9f), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Color(0xFF475569), textAlign = TextAlign.Center)
            Text("Grade", modifier = Modifier.weight(1.0f), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Color(0xFF475569), textAlign = TextAlign.Center)
        }

        semesterGrades.forEachIndexed { index, grade ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp, horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(grade.courseName, modifier = Modifier.weight(3.0f), style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, color = Color(0xFF1E293B))
                Text(grade.courseCode, modifier = Modifier.weight(1.5f), style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
                
                val crFmt = if (grade.credits % 1.0 == 0.0) grade.credits.toInt().toString() else grade.credits.toString()
                Text(crFmt, modifier = Modifier.weight(0.9f), style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center, color = Color(0xFF1E293B))

                Box(
                    modifier = Modifier.weight(1.0f),
                    contentAlignment = Alignment.Center
                ) {
                    GradeBadge(grade.grade)
                }
            }

            if (index < semesterGrades.size - 1) {
                HorizontalDivider(color = Color(0xFFE2E8F0))
            }
        }
    }
}

@Composable
fun GradeBadge(grade: String) {
    val uppercaseGrade = grade.uppercase()
    val (backgroundColor, textColor) = when (uppercaseGrade) {
        "S" -> Color(0xFFE8F5E9) to Color(0xFF2E7D32)      // Light green, dark green text
        "A" -> Color(0xFFE0F2F1) to Color(0xFF00695C)      // Mint/teal, dark teal text
        "B" -> Color(0xFFE3F2FD) to Color(0xFF1565C0)      // Light blue, dark blue text
        "C" -> Color(0xFFFFF3E0) to Color(0xFFE65100)      // Light orange, dark orange text
        "D", "E" -> Color(0xFFF3E5F5) to Color(0xFF6A1B9A) // Light purple, dark purple text
        "P" -> Color(0xFFE0F7FA) to Color(0xFF00838F)      // Light cyan, dark cyan text
        else -> Color(0xFFFFEBEE) to Color(0xFFC62828)     // Light red, dark red text
    }

    Box(
        modifier = Modifier
            .background(backgroundColor, shape = RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 2.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = uppercaseGrade,
            color = textColor,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 11.sp
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddGradeDialog(
    onDismiss: () -> Unit,
    onSave: (CourseGrade) -> Unit
) {
    var semester by remember { mutableStateOf("1") }
    var courseCode by remember { mutableStateOf("") }
    var courseName by remember { mutableStateOf("") }
    var credits by remember { mutableStateOf("3") }
    var grade by remember { mutableStateOf("S") }

    val gradePointsMap = mapOf(
        "S" to 10,
        "A" to 9,
        "B" to 8,
        "C" to 7,
        "D" to 6,
        "E" to 5,
        "P" to 0,
        "A_ABSENT" to 0
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Completed Course Grade", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = semester,
                    onValueChange = { semester = it },
                    label = { Text("Semester Number (e.g. 1)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )

                OutlinedTextField(
                    value = courseCode,
                    onValueChange = { courseCode = it },
                    label = { Text("Course Code (e.g. CS101)") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("grade_code_input"),
                    singleLine = true
                )

                OutlinedTextField(
                    value = courseName,
                    onValueChange = { courseName = it },
                    label = { Text("Course Title / Subject Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = credits,
                    onValueChange = { credits = it },
                    label = { Text("Course Credits Count (e.g. 4)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true
                )

                Text("Grade Letter Obtained", fontWeight = FontWeight.Medium, fontSize = 14.sp)
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(gradePointsMap.keys.toList()) { g ->
                        val selected = grade == g
                        ElevatedButton(
                            onClick = { grade = g },
                            contentPadding = PaddingValues(horizontal = 8.dp),
                            modifier = Modifier.widthIn(min = 44.dp),
                            colors = ButtonDefaults.elevatedButtonColors(
                                containerColor = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                                contentColor = if (selected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        ) {
                            Text(g)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val semInt = semester.toIntOrNull() ?: 1
                    val crDouble = credits.toDoubleOrNull() ?: 3.0
                    val pts = gradePointsMap[grade] ?: 0
                    if (courseCode.isNotEmpty()) {
                        onSave(
                            CourseGrade(
                                semester = semInt,
                                courseCode = courseCode,
                                courseName = courseName,
                                credits = crDouble,
                                grade = grade,
                                gradePoints = pts
                            )
                        )
                    }
                },
                modifier = Modifier.testTag("save_grade_button")
            ) {
                Text("Save Grade")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
