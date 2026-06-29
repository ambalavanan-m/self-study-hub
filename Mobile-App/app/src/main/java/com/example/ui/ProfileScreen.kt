package com.example.ui

import android.content.ClipboardManager
import android.content.ClipData
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import com.example.data.*
import com.google.firebase.auth.FirebaseAuth
import java.text.SimpleDateFormat
import java.util.*

// ==========================================
// 1. LANDING / ONBOARDING SCREEN
// ==========================================
@Composable
fun LandingScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToSignup: () -> Unit,
    onExploreAsGuest: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                        MaterialTheme.colorScheme.surface
                    )
                )
            )
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        // Large Logo / Graphic Placeholder
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.logo),
                contentDescription = "StudyTrack Logo",
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "StudyTrack",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.primary,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Self Study Hub",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "The ultimate academic dashboard to track your CGPA, parse VIT FFCS schedules, monitor study habits, and organize tasks securely.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Feature Highlights Grid
        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            FeatureItem(
                icon = Icons.Default.CalendarViewMonth,
                title = "Interactive Weekly Grid",
                description = "Custom Theory and Lab timetable matrix matching VIT slots (A1, B1, L1-L60)."
            )
            FeatureItem(
                icon = Icons.Default.TrendingUp,
                title = "CGPA Target Manager",
                description = "Group grades by semesters, calculate term GPA and track overall target scores."
            )
            FeatureItem(
                icon = Icons.Default.Timer,
                title = "Focus Pomodoro & Notes",
                description = "Stay focused with customizable countdown timers and capture course reminders."
            )
        }

        Spacer(modifier = Modifier.height(48.dp))

        // Action Buttons
        Button(
            onClick = onExploreAsGuest,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .testTag("explore_as_guest"),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Explore Academic Hub", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onNavigateToLogin,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("login_redirect"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Log In")
            }

            OutlinedButton(
                onClick = onNavigateToSignup,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .testTag("signup_redirect"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Sign Up")
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun FeatureItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, description: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

// ==========================================
// 2. AUTHENTICATION SCREENS (LOGIN / SIGNUP)
// ==========================================
@Composable
fun LoginScreen(
    onLoginSuccess: (String) -> Unit,
    onBackToLanding: () -> Unit,
    onGoToSignup: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {


        Spacer(modifier = Modifier.height(16.dp))

        Box(
            modifier = Modifier
                .size(80.dp)
                .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Lock, contentDescription = "Lock", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Log In to StudyTrack", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Organize and manage your classes seamlessly.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("University Email / Registered ID") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login_email"),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login_password"),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(modifier = Modifier.height(24.dp))

        var isLoading by remember { mutableStateOf(false) }

        Button(
            onClick = {
                if (email.contains("@") && password.length >= 6) {
                    isLoading = true
                    FirebaseAuth.getInstance().signInWithEmailAndPassword(email.trim(), password)
                        .addOnSuccessListener { authResult ->
                            isLoading = false
                            val displayName = authResult.user?.displayName ?: authResult.user?.email?.substringBefore("@") ?: "Scholar"
                            onLoginSuccess(displayName)
                            Toast.makeText(context, "Logged in with Firebase!", Toast.LENGTH_SHORT).show()
                        }
                        .addOnFailureListener { exception ->
                            isLoading = false
                            Toast.makeText(context, "Authentication Failed: ${exception.message}", Toast.LENGTH_LONG).show()
                        }
                } else {
                    Toast.makeText(context, "Please enter a valid email and password (min 6 chars)", Toast.LENGTH_SHORT).show()
                }
            },
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("submit_login_button")
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
            } else {
                Text("Sign In")
            }
        }

    }
}

@Composable
fun SignupScreen(
    onSignupSuccess: (String) -> Unit,
    onBackToLanding: () -> Unit,
    onGoToLogin: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        IconButton(
            onClick = onBackToLanding,
            modifier = Modifier.align(Alignment.Start)
        ) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Register Account", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Join your university study hub companion.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Full Name") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_name"),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_email"),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password (min 6 characters)") },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_password"),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = { Text("Confirm Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(modifier = Modifier.height(24.dp))

        var isLoading by remember { mutableStateOf(false) }

        Button(
            onClick = {
                if (name.isNotEmpty() && email.contains("@") && password == confirmPassword && password.length >= 6) {
                    isLoading = true
                    FirebaseAuth.getInstance().createUserWithEmailAndPassword(email.trim(), password)
                        .addOnSuccessListener { authResult ->
                            isLoading = false
                            onSignupSuccess(name)
                            Toast.makeText(context, "Firebase registration successful!", Toast.LENGTH_SHORT).show()
                        }
                        .addOnFailureListener { exception ->
                            isLoading = false
                            Toast.makeText(context, "Registration Failed: ${exception.message}", Toast.LENGTH_LONG).show()
                        }
                } else {
                    Toast.makeText(context, "Validation failed! Check matching password and valid email.", Toast.LENGTH_SHORT).show()
                }
            },
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("submit_signup_button")
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
            } else {
                Text("Create Account")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(onClick = onGoToLogin) {
            Text("Already registered? Login to your account.")
        }
    }
}

// ==========================================
// 3. PROFILE & SETTINGS FULL DIALOG / SCREEN
// ==========================================
@Composable
fun ProfileScreen(
    viewModel: AcademicViewModel,
    currentName: String,
    avatarUrl: String,
    classesCount: Int,
    cgpa: Double,
    onUpdateProfile: (String, String) -> Unit,
    onSignOut: () -> Unit,
    onDismiss: (() -> Unit)? = null
) {
    var nameInput by remember { mutableStateOf(currentName) }
    var avatarInput by remember { mutableStateOf(avatarUrl) }
    val context = LocalContext.current
 
    Surface(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Profile & Settings",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                if (onDismiss != null) {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close Settings")
                    }
                }
            }

            // User Identity Header
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Avatar circle placeholder
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        if (avatarUrl.startsWith("http")) {
                            coil.compose.AsyncImage(
                                model = avatarUrl,
                                contentDescription = "Profile Picture",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = androidx.compose.ui.layout.ContentScale.Crop
                            )
                        } else {
                            Text(
                                text = currentName.take(1).uppercase(),
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 28.sp
                            )
                        }
                    }

                    Column {
                        Text(
                            text = currentName,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "Academic Status: Active Scholar",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                        )
                    }
                }
            }

            // Personal Information (Read-Only)
            val currentEmail = viewModel.syncManager.currentUserEmail ?: "Offline Scholar / Guest"
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Personal Information", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleSmall)
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Full Name", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(currentName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }
                    
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Email Address", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(currentEmail, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                    }

                    if (avatarUrl.isNotEmpty() && avatarUrl != "Default") {
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Avatar URL", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = avatarUrl,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary,
                                maxLines = 1,
                                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            HorizontalDivider()

            // Summary Stats Card
            Text("Hub Academic Activity Stats", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCompactBox(title = "Classes Scheduled", value = "$classesCount", modifier = Modifier.weight(1f))
                StatCompactBox(title = "Current CGPA Score", value = String.format(Locale.getDefault(), "%.2f", cgpa), modifier = Modifier.weight(1f))
            }

            HorizontalDivider()

            // Firebase Cloud Sync Section
            Text("Firebase Cloud Sync (study-hub-007)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
            
            val isFirebaseLoggedIn = viewModel.syncManager.isUserLoggedIn
            
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isFirebaseLoggedIn) MaterialTheme.colorScheme.primary.copy(alpha = 0.05f) 
                                     else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (isFirebaseLoggedIn) Icons.Default.CloudDone else Icons.Default.CloudOff,
                            contentDescription = "Sync Status",
                            tint = if (isFirebaseLoggedIn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                        )
                        Column {
                            Text(
                                text = if (isFirebaseLoggedIn) "Cloud Connection Active" else "Offline Mode",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Text(
                                text = "Account: $currentEmail",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    if (isFirebaseLoggedIn) {
                        var isSyncingDown by remember { mutableStateOf(false) }

                        Button(
                            onClick = {
                                isSyncingDown = true
                                viewModel.downloadFromFirebase(
                                    onSuccess = {
                                        isSyncingDown = false
                                        Toast.makeText(context, "Database synced with study-hub-007!", Toast.LENGTH_SHORT).show()
                                    },
                                    onFailure = { exception ->
                                        isSyncingDown = false
                                        Toast.makeText(context, "Sync failed: ${exception.message}", Toast.LENGTH_LONG).show()
                                    }
                                )
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            enabled = !isSyncingDown
                        ) {
                            if (isSyncingDown) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary)
                            } else {
                                Icon(Icons.Default.CloudDownload, contentDescription = "Download", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Sync Cloud Data", fontSize = 12.sp)
                            }
                        }
                    } else {
                        Text(
                            text = "Log in or Sign up from the main menu to unlock seamless real-time cloud data storage under study-hub-007.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            HorizontalDivider()

            // Backup & Export Actions
            Text("Offline JSON Actions (Backup & Portability)", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            
            OutlinedButton(
                onClick = {
                    val backupJson = """
                        {
                          "appName": "Self Study Hub",
                          "backupVersion": 1,
                          "timestamp": ${System.currentTimeMillis()},
                          "cgpa": $cgpa,
                          "profile": {
                            "name": "$currentName",
                            "avatar": "$avatarUrl"
                          }
                        }
                    """.trimIndent()
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("Academic Hub Backup", backupJson))
                    Toast.makeText(context, "Full JSON backup payload copied to clipboard!", Toast.LENGTH_LONG).show()
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.CloudUpload, contentDescription = "Backup JSON")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Export JSON Database Backup Payload")
            }



            Spacer(modifier = Modifier.height(24.dp))

            // Logout action button
            Button(
                onClick = {
                    FirebaseAuth.getInstance().signOut()
                    onSignOut()
                    onDismiss?.invoke()
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("sign_out_button"),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = "Sign Out", tint = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out Session", fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun StatCompactBox(title: String, value: String, modifier: Modifier = Modifier) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = title, fontSize = 10.sp, textAlign = TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
