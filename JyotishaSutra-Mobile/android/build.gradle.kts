allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    val configureProject = {
        val extension = extensions.findByName("android") as? com.android.build.gradle.BaseExtension
        extension?.apply {
            compileSdkVersion(36)
            defaultConfig {
                targetSdkVersion(36)
                minSdkVersion(21)
            }
        }
    }

    if (state.executed) {
        configureProject()
    } else {
        afterEvaluate { configureProject() }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
