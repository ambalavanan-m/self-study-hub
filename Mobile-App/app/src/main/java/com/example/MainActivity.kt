package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.AcademicApp
import com.example.ui.AcademicViewModel
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Request notification permission for Android 13+
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
      val permission = android.Manifest.permission.POST_NOTIFICATIONS
      if (checkSelfPermission(permission) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
        requestPermissions(arrayOf(permission), 101)
      }
    }

    setContent {
      MyApplicationTheme {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background
        ) {
          val viewModel: AcademicViewModel = viewModel()
          AcademicApp(viewModel = viewModel)
        }
      }
    }
  }
}
