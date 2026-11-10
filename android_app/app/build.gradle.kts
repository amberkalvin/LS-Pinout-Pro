plugins {
    id("com.android.application")
}

android {
    namespace = "com.lt1swap.pinoutmaster"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.lt1swap.pinoutmaster"
        minSdk = 24
        targetSdk = 34
        versionCode = 3
        versionName = "2.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}
