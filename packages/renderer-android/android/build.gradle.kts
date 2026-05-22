plugins {
  id("com.android.library") version "8.7.3"
  kotlin("android") version "2.0.21"
}

android {
  namespace = "dev.terajs.renderer.android"
  compileSdk = 35

  defaultConfig {
    minSdk = 26
  }

  buildFeatures {
    buildConfig = false
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  sourceSets.named("main") {
    manifest.srcFile("src/main/AndroidManifest.xml")
    java.srcDirs("src/main/kotlin")
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

dependencies {
}