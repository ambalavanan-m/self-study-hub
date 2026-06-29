package com.example.data

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import java.util.Calendar
import java.util.Locale

class ClassAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val subjectName = intent.getStringExtra("subject_name") ?: "Class"
        val room = intent.getStringExtra("room") ?: ""
        val startTime = intent.getStringExtra("start_time") ?: ""

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "class_reminder_channel"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Class Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications sent before classes start"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val contentText = if (room.isNotEmpty()) {
            "Your class $subjectName starts at $startTime in Room $room."
        } else {
            "Your class $subjectName starts at $startTime."
        }

        // Action to open MainActivity
        val activityIntent = Intent(context, Class.forName("com.example.MainActivity")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            activityIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Upcoming Class Reminder")
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notification)
    }
}

object NotificationScheduler {
    fun scheduleClassNotifications(context: Context, classes: List<SubjectClass>) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Cancel previous alarms
        val prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
        val activeCodesCount = prefs.getInt("active_codes_count", 0)
        for (i in 0 until activeCodesCount) {
            val intent = Intent(context, ClassAlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                i,
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }

        val dayMap = mapOf(
            "monday" to Calendar.MONDAY,
            "tuesday" to Calendar.TUESDAY,
            "wednesday" to Calendar.WEDNESDAY,
            "thursday" to Calendar.THURSDAY,
            "friday" to Calendar.FRIDAY,
            "saturday" to Calendar.SATURDAY,
            "sunday" to Calendar.SUNDAY
        )

        var alarmIndex = 0
        for (cls in classes) {
            val dayOfWeekCalendar = dayMap[cls.dayOfWeek.lowercase(Locale.getDefault())] ?: continue
            val timeParts = cls.startTime.split(":")
            if (timeParts.size < 2) continue
            val hour = timeParts[0].toIntOrNull() ?: continue
            val minute = timeParts[1].toIntOrNull() ?: continue

            // Calculate alarm time (10 minutes before class)
            val calendar = Calendar.getInstance().apply {
                timeInMillis = System.currentTimeMillis()
                set(Calendar.DAY_OF_WEEK, dayOfWeekCalendar)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                add(Calendar.MINUTE, -10)
            }

            // If the time is in the past for this week, schedule for next week
            if (calendar.timeInMillis <= System.currentTimeMillis()) {
                calendar.add(Calendar.WEEK_OF_YEAR, 1)
            }

            val intent = Intent(context, ClassAlarmReceiver::class.java).apply {
                putExtra("subject_name", cls.subjectName)
                putExtra("room", cls.room)
                putExtra("start_time", cls.startTime)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmIndex,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                }
            } catch (e: SecurityException) {
                // Fallback to inexact alarm if SCHEDULE_EXACT_ALARM is not granted
                alarmManager.set(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            }
            alarmIndex++
        }

        prefs.edit().putInt("active_codes_count", alarmIndex).apply()
    }
}
