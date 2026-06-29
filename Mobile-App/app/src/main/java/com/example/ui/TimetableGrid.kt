package com.example.ui

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.SubjectClass

@Composable
fun WeeklyGridScreen(
    classes: List<SubjectClass>,
    onAddClassAtSlot: (String, String, String) -> Unit,
    onClassClick: (SubjectClass) -> Unit
) {
    val days = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
    
    val theorySlots = mapOf(
        "Monday" to listOf("A1", "F1", "D1", "TB1", "TG1", "-", "LUNCH", "A2", "F2", "D2", "TB2", "TG2", "-"),
        "Tuesday" to listOf("B1", "G1", "E1", "TC1", "TAA1", "-", "LUNCH", "B2", "G2", "E2", "TC2", "TAA2", "-"),
        "Wednesday" to listOf("C1", "A1", "F1", "V1", "V2", "-", "LUNCH", "C2", "A2", "F2", "TD2", "TBB2", "-"),
        "Thursday" to listOf("D1", "B1", "G1", "TE1", "TCC1", "-", "LUNCH", "D2", "B2", "G2", "TE2", "TCC2", "-"),
        "Friday" to listOf("E1", "C1", "TA1", "TF1", "TD1", "-", "LUNCH", "E2", "C2", "TA2", "TF2", "TDD2", "-")
    )
    
    val labSlots = mapOf(
        "Monday" to listOf("L1", "L2", "L3", "L4", "L5", "L6", "LUNCH", "L31", "L32", "L33", "L34", "L35", "L36"),
        "Tuesday" to listOf("L7", "L8", "L9", "L10", "L11", "L12", "LUNCH", "L37", "L38", "L39", "L40", "L41", "L42"),
        "Wednesday" to listOf("L13", "L14", "L15", "L16", "L17", "L18", "LUNCH", "L43", "L44", "L45", "L46", "L47", "L48"),
        "Thursday" to listOf("L19", "L20", "L21", "L22", "L23", "L24", "LUNCH", "L49", "L50", "L51", "L52", "L53", "L54"),
        "Friday" to listOf("L25", "L26", "L27", "L28", "L29", "L30", "LUNCH", "L55", "L56", "L57", "L58", "L59", "L60")
    )

    val periodHeaders = listOf(
        PeriodHeader("Period 1", "08:00 - 08:50 AM", "08:00 - 08:50 AM"),
        PeriodHeader("Period 2", "09:00 - 09:50 AM", "08:51 - 09:40 AM"),
        PeriodHeader("Period 3", "10:00 - 10:50 AM", "09:51 - 10:40 AM"),
        PeriodHeader("Period 4", "11:00 - 11:50 AM", "10:41 - 11:30 AM"),
        PeriodHeader("Period 5", "12:00 - 12:50 PM", "11:40 AM - 12:30 PM"),
        PeriodHeader("Period 6", "-", "12:31 - 01:20 PM"),
        PeriodHeader("LUNCH", "01:00 - 02:00 PM", "01:00 - 02:00 PM"),
        PeriodHeader("Period 7", "02:00 - 02:50 PM", "02:00 - 02:50 PM"),
        PeriodHeader("Period 8", "03:00 - 03:50 PM", "02:51 - 03:40 PM"),
        PeriodHeader("Period 9", "04:00 - 04:50 PM", "03:51 - 04:40 PM"),
        PeriodHeader("Period 10", "05:00 - 05:50 PM", "04:41 - 05:30 PM"),
        PeriodHeader("Period 11", "06:00 - 06:50 PM", "05:40 - 06:30 PM"),
        PeriodHeader("Period 12", "06:51 - 07:00 PM", "06:31 - 07:20 PM")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Quick help card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = "🗓️ University Slot Matrix",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Displays standard Theory & Lab slot mapping for your scheduled classes.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Scrollable container for the huge grid
        val horizontalScrollState = rememberScrollState()
        val verticalScrollState = rememberScrollState()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .horizontalScroll(horizontalScrollState)
                .verticalScroll(verticalScrollState)
        ) {
            Column {
                // Header row
                Row(
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(bottom = 8.dp)
                ) {
                    // Top-left block (Day/Type descriptor)
                    Box(
                        modifier = Modifier
                            .width(118.dp) // 56dp (Day) + 56dp (Type) + 6dp gap
                            .height(44.dp)
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "DAY & TYPE",
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "12-Period Grid",
                                fontSize = 8.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    // Column headers
                    periodHeaders.forEach { header ->
                        val isLunch = header.title == "LUNCH"
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (isLunch) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surfaceVariant
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .width(96.dp)
                                .height(44.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(2.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = header.title,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    color = if (isLunch) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(1.dp))
                                Text(
                                    text = "Th: ${header.theoryTime}",
                                    fontSize = 7.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Lb: ${header.labTime}",
                                    fontSize = 7.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(6.dp))
                    }
                }

                // Days rows (Monday - Friday)
                days.forEach { day ->
                    val dayTheorySlots = theorySlots[day] ?: emptyList()
                    val dayLabSlots = labSlots[day] ?: emptyList()

                    Row(
                        modifier = Modifier.padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Day Label spanning both THEORY and LAB rows
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .width(56.dp)
                                .height(104.dp) // 48dp (Theory) + 48dp (Lab) + 8dp spacing
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = day.take(3).uppercase(),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = Color.White,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // A Column for the THEORY and LAB sub-rows
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // --- THEORY ROW ---
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Row Type label
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier
                                        .width(56.dp)
                                        .height(48.dp)
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "THEORY",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(6.dp))

                                // Render theory cells
                                periodHeaders.forEachIndexed { index, header ->
                                    val isLunchCol = header.title == "LUNCH"
                                    val slotCode = if (isLunchCol) "LUNCH" else dayTheorySlots.getOrNull(index) ?: "-"
                                    
                                    RenderCell(
                                        day = day,
                                        type = "theory",
                                        slotCode = slotCode,
                                        isLunchCol = isLunchCol,
                                        classes = classes,
                                        onAddClassAtSlot = onAddClassAtSlot,
                                        onClassClick = onClassClick
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                }
                            }

                            // --- LAB ROW ---
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Row Type label
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.08f)),
                                    shape = RoundedCornerShape(6.dp),
                                    modifier = Modifier
                                        .width(56.dp)
                                        .height(48.dp)
                                ) {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "LAB",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp,
                                            color = MaterialTheme.colorScheme.secondary
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(6.dp))

                                // Render lab cells
                                periodHeaders.forEachIndexed { index, header ->
                                    val isLunchCol = header.title == "LUNCH"
                                    val slotCode = if (isLunchCol) "LUNCH" else dayLabSlots.getOrNull(index) ?: "-"
                                    
                                    RenderCell(
                                        day = day,
                                        type = "lab",
                                        slotCode = slotCode,
                                        isLunchCol = isLunchCol,
                                        classes = classes,
                                        onAddClassAtSlot = onAddClassAtSlot,
                                        onClassClick = onClassClick
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
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
fun RenderCell(
    day: String,
    type: String,
    slotCode: String,
    isLunchCol: Boolean,
    classes: List<SubjectClass>,
    onAddClassAtSlot: (String, String, String) -> Unit,
    onClassClick: (SubjectClass) -> Unit
) {
    if (isLunchCol || slotCode == "LUNCH") {
        // Lunch Cell
        Box(
            modifier = Modifier
                .width(96.dp)
                .height(48.dp)
                .background(MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.25f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "LUNCH BREAK",
                fontWeight = FontWeight.Bold,
                fontSize = 9.sp,
                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.6f)
            )
        }
    } else if (slotCode == "-") {
        // Null Cell
        Box(
            modifier = Modifier
                .width(96.dp)
                .height(48.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "-",
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
            )
        }
    } else {
        // Regular Slot Cell - look for class matched to this day, type, and slotCode
        val matchingClass = classes.firstOrNull { cls ->
            cls.dayOfWeek.equals(day, ignoreCase = true) &&
            cls.type.equals(type, ignoreCase = true) &&
            cls.slot.equals(slotCode, ignoreCase = true)
        }

        if (matchingClass != null) {
            // Occupied Slot Card
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = Color(matchingClass.colorArgb).copy(alpha = 0.15f)
                ),
                border = BorderStroke(2.dp, Color(matchingClass.colorArgb)),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .width(96.dp)
                    .height(48.dp)
                    .clickable { onClassClick(matchingClass) }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(3.dp),
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = if (matchingClass.subjectCode.isNotEmpty()) matchingClass.subjectCode else matchingClass.subjectName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (matchingClass.subjectCode.isNotEmpty()) matchingClass.subjectName else "Slot: $slotCode",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 8.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = Color(matchingClass.colorArgb)
                    )
                    Text(
                        text = if (matchingClass.subjectCode.isNotEmpty()) "Slot: $slotCode | Rm: ${matchingClass.room}" else "Rm: ${matchingClass.room}",
                        fontSize = 7.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            // Vacant Slot Cell (View only, non-clickable)
            Box(
                modifier = Modifier
                    .width(96.dp)
                    .height(48.dp)
                    .border(
                        width = 1.dp,
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = slotCode,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.35f)
                )
            }
        }
    }
}

data class PeriodHeader(
    val title: String,
    val theoryTime: String,
    val labTime: String
)
