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

  testOptions {
    unitTests {
      isIncludeAndroidResources = true
    }
  }

  sourceSets.named("main") {
    manifest.srcFile("src/main/AndroidManifest.xml")
    java.srcDirs("src/main/kotlin")
  }

  sourceSets.named("test") {
    java.srcDirs("src/test/kotlin")
    resources.srcDirs("src/test/resources")
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

dependencies {
  implementation("org.mozilla:rhino:1.9.1")
  testImplementation("androidx.test:core:1.6.1")
  testImplementation("junit:junit:4.13.2")
  testImplementation("org.robolectric:robolectric:4.14.1")
}